import { supabase } from "@/lib/supabase";
import { encrypt, decrypt, maskKey } from "@/lib/crypto";

export interface UserApiKeyRow {
  id: string;
  user_id: string;
  provider: string;
  encrypted_value: string;
  key_hint: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaskedKey {
  provider: string;
  key_hint: string | null;
  metadata: Record<string, string> | null;
  created_at: string;
  updated_at: string;
}

/** Get decrypted key + metadata for a user+provider. */
export async function getUserApiKeyWithMeta(
  userId: string,
  provider: string
): Promise<{ key: string | null; metadata: Record<string, string> | null }> {
  const { data, error } = await supabase
    .from("user_api_keys")
    .select("encrypted_value, metadata")
    .eq("user_id", userId)
    .eq("provider", provider)
    .single();

  if (error || !data) return { key: null, metadata: null };
  const key = data.encrypted_value ? decrypt(data.encrypted_value) : null;
  return { key, metadata: (data.metadata as Record<string, string>) || null };
}

/** Get the decrypted key for a user+provider. Returns null if not set. */
export async function getUserApiKey(
  userId: string,
  provider: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("user_api_keys")
    .select("encrypted_value")
    .eq("user_id", userId)
    .eq("provider", provider)
    .single();

  if (error || !data?.encrypted_value) return null;
  return decrypt(data.encrypted_value);
}

/** List all keys for a user (masked — no raw values). */
export async function listUserApiKeys(userId: string): Promise<MaskedKey[]> {
  const { data, error } = await supabase
    .from("user_api_keys")
    .select("provider, key_hint, metadata, created_at, updated_at")
    .eq("user_id", userId)
    .order("provider");

  if (error || !data) return [];
  return data as MaskedKey[];
}

/** Upsert a key for a user+provider. Encrypts before storing. metadata is optional (used for LLM base_url/model). */
export async function upsertUserApiKey(
  userId: string,
  provider: string,
  rawKey: string,
  metadata?: Record<string, string>
): Promise<void> {
  const encryptedValue = encrypt(rawKey);
  const hint = maskKey(rawKey);

  const { error } = await supabase
    .from("user_api_keys")
    .upsert(
      {
        user_id: userId,
        provider,
        encrypted_value: encryptedValue,
        key_hint: hint,
        metadata: metadata || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider" }
    );

  if (error) throw new Error(`Failed to save key: ${error.message}`);
}

/** Delete a key for a user+provider. */
export async function deleteUserApiKey(
  userId: string,
  provider: string
): Promise<void> {
  const { error } = await supabase
    .from("user_api_keys")
    .delete()
    .eq("user_id", userId)
    .eq("provider", provider);

  if (error) throw new Error(`Failed to delete key: ${error.message}`);
}
