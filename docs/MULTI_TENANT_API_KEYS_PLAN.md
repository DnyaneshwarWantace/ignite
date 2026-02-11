# Multi-Tenant / Per-User API Keys – Implementation Plan

## Goal
Turn the app into a **white-label / B2B** setup where:
- **Each company/user** logs in and adds **their own** API keys (ScrapeCreators, OpenAI, Anthropic, etc.).
- **Nothing is “yours”** – no shared app API keys; database can stay yours (single Supabase), but **data and keys are scoped per user**.
- Keys are **stored securely**, used **only for that user’s requests**, and users can **view (masked), change, and delete** their keys.

---

## 1. How It Works Today (Current State)

### 1.1 API keys – all from env (global)
| Key | Where used | File(s) |
|-----|------------|--------|
| **ScrapeCreators** | X-ray refresh (scrape ads), status check, discover | `src/apiUtils/adScraper.ts` |
| **OpenAI** | Writer (concepts, hooks, build-ad, analyze-ads), analyze-image, editor generate-variations | `src/app/api/v1/writer/*.ts`, `analyze-image/route.ts`, `editor/*/generate-variations/route.ts` |
| **Anthropic** | (If used anywhere – grep for ANTHROPIC) | - |
| **Pexels** | Editor images/videos | `src/app/api/editor/*/pexels/route.ts`, `pexels-videos/route.ts` |
| **Remotion AWS** | Video render Lambda | `src/app/api/editor/*/render-lambda/route.ts` |
| **COMBO_SH_JWT** | Image/video render | `src/app/api/editor/*/render/route.ts` |
| **MailerSend** | Emails | `src/apiUtils/helpers.ts` |
| **Google Auth** | Login | `src/app/api/auth/[...nextauth]/options.ts` |

All of these read from `process.env.*` – one set of keys for the whole app.

### 1.2 Auth
- **NextAuth** with Google + Credentials.
- Session has `session.user.id` (and email, name).
- APIs use `authMiddleware` → `getLoggedInUser()` so you get `user` (id, email, name) in protected routes.

### 1.3 Data scoping today
- **Already per-user:** folders, saved_ad_folders, saved_ads, created_ads, writer saved ads, editor projects/assets/variations (all use `user_id`).
- **Not per-user:** `brands` and `ads` – no `user_id`; brands list returns all brands. So any logged-in user can see and refresh any brand. For multi-tenant you must scope brands (and thus ads) to the user.

---

## 2. What You Need to Change (High Level)

1. **Store per-user API keys** in the DB (encrypted), and **never** use global env for those keys when a user is logged in (optional: fallback to env for dev).
2. **Use the logged-in user’s keys** in every API that calls ScrapeCreators, OpenAI, etc. (fetch keys by `user_id` in the route, pass to the service).
3. **Scope brands (and ads) to the user** so each company only sees their own brands/ads.
4. **Settings UI**: pages where the user can add/update/delete their keys (masked in UI, never send raw keys to client).
5. **Security**: encrypt keys at rest, access only server-side, optional RLS so `user_id` can’t be bypassed.

---

## 3. Storing Keys – Encrypted, and Supporting Any Provider

### 3.0 Can we store API keys? Which providers?

- **Yes, we store them.** We don’t need OpenAI (or Anthropic, etc.) to “allow” storing keys. The user gives us their key so we can call the API on their behalf – that’s normal “bring your own key” (BYOK). Many products (Zapier, Make, n8n) do this. We must:
  - **Encrypt at rest** (e.g. AES-256 with a server secret).
  - **Use only on the server** – never send the raw key to the browser.
  - Let the user **update or delete** their key anytime.

- **User can use any provider we support.** We don’t lock to “only OpenAI”. We support multiple **LLM providers** (OpenAI, Anthropic, etc.) and **other integrations** (ScrapeCreators, Pexels, etc.):
  - **LLM (AI text):** `openai`, `anthropic`, and later e.g. `google` (Gemini), `groq`, etc. User adds the key for the provider they want. When we need to call an LLM, we use **whichever provider the user has configured** (e.g. default provider or “first available”).
  - **Other:** `scrape_creators`, `pexels`, etc. Each has its own key; we use the user’s key for that provider when making requests.

So: one table stores **all** user keys by `provider`; we encrypt every key the same way; and at runtime we pick the right provider (and thus the right key and API client) for each feature.

---

## 4. Data Model Changes

### 4.1 New table: `user_api_keys`

Store one row per user per provider; keys encrypted.

```sql
-- Optional: enable pgcrypto for encryption
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS user_api_keys (
  id TEXT PRIMARY KEY DEFAULT ('key_' || replace(uuid_generate_v4()::text, '-', '')),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,  -- 'scrape_creators' | 'openai' | 'anthropic' | 'pexels' | etc.
  encrypted_value TEXT,   -- encrypted API key (or null if deleted)
  key_hint TEXT,          -- e.g. last 4 chars for display: "sk-...xyz"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

CREATE INDEX idx_user_api_keys_user_id ON user_api_keys(user_id);
```

- **Encryption:** Encrypt before insert (e.g. AES-256 with a server-side secret from env like `ENCRYPTION_SECRET`). Decrypt only in API routes when making requests.
- **key_hint:** Store last 4 characters (or “sk-…xyz”) so the UI can show “ScrapeCreators: …xyz” without ever sending the full key.
- **provider** examples: `scrape_creators`, `openai`, `anthropic`, `google`, `pexels`, etc. You can add new providers without schema changes.

### 4.2 Scope brands to user

Add `user_id` to brands so each company only has access to their own brands (and thus their own ads).

```sql
ALTER TABLE brands ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_brands_user_id ON brands(user_id);
-- Backfill: either set to a default user or leave null and filter "where user_id = current or user_id is null" until migrated
```

- All brands listing and brand-by-id must filter by `user_id = session.user.id` (and optionally `user_id IS NULL` for legacy if you backfill later).
- When creating a brand (e.g. add-to-folder-manually), set `brand.user_id = user.id`.

---

## 5. Where to Use User Keys (Code Changes)

### 5.1 ScrapeCreators (ad scraper, status check)

**Current:** `src/apiUtils/adScraper.ts` reads `process.env.SCRAPE_CREATORS_API_KEY`.

**Change:**
- **Option A (recommended):** Add an optional parameter to all scraper functions, e.g. `apiKey?: string`. If provided, use it; else fall back to env (for cron/backward compatibility if you still have a global key).
- Callers (e.g. refresh route, status check script) get the current user’s key from `user_api_keys` and pass it in.

Example:

```ts
// adScraper.ts
export async function scrapeCompanyAds(
  pageId: string,
  limit: number = 200,
  offset: number = 0,
  apiKey?: string  // per-user key
) {
  const key = apiKey || process.env.SCRAPE_CREATORS_API_KEY || process.env.NEXT_PUBLIC_SCRAPE_CREATORS_API_KEY;
  if (!key) throw new Error('ScrapeCreators API key not found. Add it in Settings or set env.');
  // ... use key in axios headers
}
```

- **Refresh route** (`src/app/api/v1/x-ray/brands/[id]/refresh/route.ts`): after auth, load user’s ScrapeCreators key from DB, then call `scrapeCompanyAds(brand.page_id, 3000, 0, userScrapeCreatorsKey)`.
- **Auto-tracker / status check:** today they use Prisma and no user context. If you run status check as a “system” job, you can keep using env there; if you want it per-user, the job must run per user and pass that user’s key.

### 4.2 OpenAI (writer, analyze-image, editor)

**Current:** Routes use `process.env.OPENAI_API_KEY`.

**Change:**
- In each route (e.g. `src/app/api/v1/writer/generate-concepts/route.ts`), after `auth()`:
  - Load OpenAI key for `session.user.id` from `user_api_keys` (provider = `'openai'`).
  - If none, return 400 with a message like “Add your OpenAI API key in Settings.”
- Pass that key into the OpenAI client (or your existing helper that takes `apiKey`).

Same idea for:
- `src/app/api/v1/writer/generate-hooks/route.ts`
- `src/app/api/v1/writer/build-ad/route.ts`
- `src/app/api/v1/writer/analyze-ads/route.ts`
- `src/app/api/v1/analyze-image/route.ts`
- `src/app/api/editor/image/generate-variations/route.ts`
- `src/app/api/editor/video/generate-variations/route.ts`

### 4.3 Other keys (Pexels, Remotion, etc.)

- **Pexels / Remotion / COMBO / MailerSend:** Same pattern: add a row per provider in `user_api_keys`, and in the corresponding API route load the key by `user_id` + provider and use it. If you don’t want to support per-user for some (e.g. Remotion AWS), you can keep those on env and only switch ScrapeCreators + OpenAI + Anthropic to per-user first.

---

## 5. Helper: Get Decrypted Key for User

Centralize “get key for this user and provider” so every route uses the same logic and encryption.

Example (server-only):

```ts
// src/lib/user-api-keys.ts
import { supabase } from '@/lib/supabase';
import { decrypt } from '@/lib/crypto'; // your AES decrypt using ENCRYPTION_SECRET

export async function getUserApiKey(userId: string, provider: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_api_keys')
    .select('encrypted_value')
    .eq('user_id', userId)
    .eq('provider', provider)
    .single();
  if (error || !data?.encrypted_value) return null;
  return decrypt(data.encrypted_value);
}
```

Use this in API routes after `auth()`. For LLM, use the **LLM adapter** (section 5.2) which internally uses this helper to get the key for the chosen provider.

---

## 7. Settings UI – Keys Management

**Page:** e.g. extend `src/app/(main)/settings/page.tsx` or add `src/app/(main)/settings/api-keys/page.tsx`.

- **List:** For each provider (ScrapeCreators, OpenAI, Anthropic, …), show:
  - Name, optional icon.
  - Status: “Configured” (show key_hint like “…xyz”) or “Not set”.
  - Buttons: “Update key”, “Delete key”.
- **Add/Update:** Modal or form with a single password-style input (value not shown in DOM after submit). On submit, call a **server action** or **API route** that:
  - Takes the plain key (over HTTPS).
  - Encrypts it, stores in `user_api_keys`, updates `key_hint`.
  - Never returns the raw key to the client.
- **Delete:** Call API that sets `encrypted_value = null` (or deletes the row). UI then shows “Not set”.

Ensure the settings page is behind auth and only shows/updates keys for `session.user.id`.

- **LLM default:** If you use “default LLM provider”, add a dropdown in Settings: “Default AI provider: OpenAI / Anthropic” (only show options the user has a key for). Save in `user_settings` or a column.

---

## 8. Security Checklist

- **Never** send raw API keys to the frontend; only `key_hint` or “Configured” / “Not set”.
- **Encrypt at rest** (e.g. AES-256) with a server-side `ENCRYPTION_SECRET` (strong, from env).
- Use **HTTPS** so keys in request bodies are not sent in clear text.
- **Server-only:** All key read/decrypt and usage happen in API routes or server actions, never in client components.
- **RLS (optional):** If using Supabase with a client that has anon key, restrict `user_api_keys` with RLS so `user_id = auth.uid()` (or your NextAuth-mapped uid). For server-side Supabase with service role, RLS is bypassed; then you must always filter by `user_id` in code.
- **Audit:** Optionally log “user X used provider Y” (no key values) for debugging.

---

## 8. Flow Summary

1. **User signs in** → `session.user.id` available.
2. **User goes to Settings → API Keys** → sees which keys are set (masked), can add/update/delete.
3. **User uses X-ray / Writer / etc.** → API route gets `user_id` from auth → loads that user’s keys from `user_api_keys` → uses only those keys for the request → returns result. No other user’s keys or data are used.
4. **Brands/ads** → All queries filter by `brands.user_id = current user` (and ads via `brand_id`), so each company only sees and refreshes their own data.

---

## 9. Optional: Env Fallback

For development or for a “default” tenant, you can keep env keys as fallback:

- If `getUserApiKey(userId, 'scrape_creators')` returns null, then use `process.env.SCRAPE_CREATORS_API_KEY` and optionally log “Using env fallback for user X”. That way one deployment can still work with a single global key until every user has set their own.

---

## 10. Files to Touch (Checklist)

| Area | Files |
|------|--------|
| DB | New migration: `user_api_keys` table; add `user_id` to `brands`. |
| Crypto | New `src/lib/crypto.ts` (or similar): encrypt/decrypt with ENCRYPTION_SECRET. |
| Keys helper | New `src/lib/user-api-keys.ts`: get/set/delete user keys (server-only). |
| Scraper | `src/apiUtils/adScraper.ts`: accept optional `apiKey`; use it when provided. |
| Refresh | `src/app/api/v1/x-ray/brands/[id]/refresh/route.ts`: get user ScrapeCreators key, pass to scraper; ensure brand belongs to user. |
| Writer | All `src/app/api/v1/writer/*.ts` and `analyze-image`: get user OpenAI key, pass to client. |
| Editor generate | `src/app/api/editor/image/generate-variations/route.ts`, `video/...`: same. |
| Brands | All brand list/get/create: filter or set `user_id`. |
| Settings UI | Settings page: list keys (masked), add/update/delete via API. |
| API for keys | New route e.g. `src/app/api/v1/settings/api-keys/route.ts`: GET (list masked), POST (upsert), DELETE (remove key). |

This plan gives you a complete path from “one global set of keys” to “each company uses their own keys and only sees their own data,” with secure storage and the ability for users to change or delete keys.
