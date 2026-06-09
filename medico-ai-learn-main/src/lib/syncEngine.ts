import { supabase } from "@/integrations/supabase/client";

export type SyncStatus = "idle" | "syncing" | "synced" | "error";
let syncStatus: SyncStatus = "idle";
const listeners: Set<(status: SyncStatus) => void> = new Set();

export function getSyncStatus() { return syncStatus; }
export function onSyncStatusChange(fn: (s: SyncStatus) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function setSyncStatus(s: SyncStatus) {
  syncStatus = s;
  listeners.forEach(fn => fn(s));
}

const debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};

/**
 * Circuit breaker: once we confirm the user_data table doesn't exist,
 * skip all further network requests for the lifetime of this page session.
 * Resets naturally on next full page load.
 */
let tableConfirmedMissing = false;

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/**
 * Returns true if the error indicates the user_data table doesn't exist yet.
 * Covers:
 *   - PostgreSQL error code 42P01 (undefined_table)
 *   - PGRST205 (table not in PostgREST schema cache)
 *   - PostgREST HTTP 404 / "relation does not exist" messages
 */
function isTableUnavailable(error: any): boolean {
  if (!error) return false;
  if (error.code === '42P01') return true;
  // PGRST205 = table not found in PostgREST schema cache
  if (error.code === 'PGRST205') return true;
  // PostgREST HTTP status checks
  if (error.status === 404 || error.status === 406) return true;
  const msg: string = (error.message ?? '').toLowerCase();
  if (msg.includes('relation') && msg.includes('does not exist')) return true;
  if (msg.includes('schema cache')) return true;
  if (msg.includes('user_data') && msg.includes('not found')) return true;
  return false;
}

function handleTableUnavailable() {
  tableConfirmedMissing = true;
  setSyncStatus("idle");
}

/**
 * Pushes a key-value pair to the cloud (Supabase `user_data` table).
 * Debounced by 2000ms per key to prevent spamming the database.
 */
export function pushToCloud(key: string, value: any) {
  if (debounceTimers[key]) clearTimeout(debounceTimers[key]);

  debounceTimers[key] = setTimeout(async () => {
    // Circuit breaker: table known to be missing, skip network request
    if (tableConfirmedMissing) return;

    const userId = await getUserId();
    if (!userId) return;

    setSyncStatus("syncing");
    try {
      const { error } = await supabase.from("user_data").upsert(
        {
          user_id: userId,
          data_key: key,
          data_value: value,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,data_key" }
      );

      if (error) {
        if (isTableUnavailable(error)) {
          handleTableUnavailable();
          return;
        }
        throw error;
      }
      setSyncStatus("synced");
    } catch (e) {
      if (isTableUnavailable(e)) {
        handleTableUnavailable();
        return;
      }
      console.error(`Sync error [${key}]:`, e);
      setSyncStatus("error");
    }
  }, 2000);
}

/**
 * Pulls a specific key from the cloud and stores it in localStorage.
 */
export async function pullFromCloud(key: string): Promise<any | null> {
  // Circuit breaker: table known to be missing, skip network request
  if (tableConfirmedMissing) return null;

  const userId = await getUserId();
  if (!userId) return null;

  setSyncStatus("syncing");
  try {
    const { data, error } = await supabase
      .from("user_data")
      .select("data_value")
      .eq("user_id", userId)
      .eq("data_key", key)
      .maybeSingle();

    if (error) {
      if (isTableUnavailable(error)) {
        handleTableUnavailable();
        return null;
      }
      throw error;
    }

    if (data && data.data_value !== undefined) {
      localStorage.setItem(key, JSON.stringify(data.data_value));
      setSyncStatus("synced");
      return data.data_value;
    }
    setSyncStatus("synced");
    return null;
  } catch (e) {
    if (isTableUnavailable(e)) {
      handleTableUnavailable();
      return null;
    }
    console.error(`Pull error [${key}]:`, e);
    setSyncStatus("error");
    return null;
  }
}

/**
 * Pulls all keys for the current user from the cloud and populates localStorage.
 * Called once on login.
 */
export async function pullAllFromCloud(): Promise<boolean> {
  // Circuit breaker: table known to be missing, skip network request
  if (tableConfirmedMissing) return false;

  const userId = await getUserId();
  if (!userId) return false;

  setSyncStatus("syncing");
  try {
    const { data, error } = await supabase
      .from("user_data")
      .select("data_key, data_value")
      .eq("user_id", userId);

    if (error) {
      if (isTableUnavailable(error)) {
        handleTableUnavailable();
        return false;
      }
      throw error;
    }

    if (data && data.length > 0) {
      for (const row of data) {
        if (row.data_key && row.data_value !== undefined) {
          localStorage.setItem(row.data_key, JSON.stringify(row.data_value));
        }
      }
    }

    setSyncStatus("synced");
    return true;
  } catch (e) {
    if (isTableUnavailable(e)) {
      handleTableUnavailable();
      return false;
    }
    console.error("Pull all from cloud error:", e);
    setSyncStatus("error");
    return false;
  }
}

// Keep a dummy legacy function around in case some parts of the app still call it while we refactor.
export async function syncFromCloud(): Promise<boolean> {
  return pullAllFromCloud();
}
export async function pushAllToCloud() {
  console.log("Legacy pushAllToCloud called. Individual writes now handle syncing.");
}
