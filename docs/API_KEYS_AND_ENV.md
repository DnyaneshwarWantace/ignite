# API Keys: Per-User vs Env

## Does it work?

**Yes.** When a user adds keys in **Settings → API Keys**, those keys are used for their requests:

- **ScrapeCreators** – Used when they refresh a brand or add a brand with ads. Stored as provider `scrape_creators`.
- **AI Model (LLM)** – Used for Writer (concepts, hooks, build-ad, analyze-ads), Analyze Image, and editor generate-variations. Stored as provider `llm` (with `base_url` and `model` in metadata).

If the user has **not** set a key in Settings, the app falls back to your **environment variables** (e.g. `SCRAPE_CREATORS_API_KEY`, `OPENAI_API_KEY`).

---

## Can I remove API keys from the .env file?

**Yes, you can remove them**, but then:

1. **Every user** who uses X-ray refresh / add brand or Writer / Analyze Image **must** add their own key in **Settings → API Keys**.  
2. If they don’t, they will see errors like:
   - *"ScrapeCreators API key not found. Add it in Settings or set SCRAPE_CREATORS_API_KEY env."*
   - *"No AI key configured. Add one in Settings → AI Model, or set OPENAI_API_KEY env."*

So:

- **Remove from .env** → No shared keys; each user must configure their own in Settings. Good for multi-tenant / white-label.
- **Keep in .env** → Env acts as fallback when a user hasn’t set a key. Good for dev or when you still want a default key.

You can also remove only some keys (e.g. remove `OPENAI_API_KEY` but keep `SCRAPE_CREATORS_API_KEY` as fallback) if you want.

---

## Which env vars are used as fallback?

| Env variable | Used when user has no key for |
|--------------|--------------------------------|
| `SCRAPE_CREATORS_API_KEY` or `NEXT_PUBLIC_SCRAPE_CREATORS_API_KEY` | ScrapeCreators (X-ray refresh, add brand) |
| `OPENAI_API_KEY` | AI Model (Writer, Analyze Image, editor variations) |

Other keys (Pexels, Remotion AWS, MailerSend, Google Auth, etc.) are still read only from env and are not per-user in Settings.
