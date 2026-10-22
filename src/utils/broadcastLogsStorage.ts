/**
 * Broadcast & Message Logs Local Storage Manager
 * Stores message dispatch history strictly on the client device (localStorage).
 * Automatically expires and deletes any log entry older than 24 hours.
 * Zero logs are stored on the backend server.
 */

export interface BroadcastLogItem {
  id: string;
  channel: 'whatsapp' | 'sms' | 'email';
  recipient: string;
  recipientName?: string;
  recipientContact?: string;
  message: string;
  subject?: string; // used for email
  status: 'SENT' | 'OPENED_IN_WHATSAPP' | 'OPENED_WA' | 'DELIVERED' | 'SUCCESS';
  sentAt: string; // ISO 8601 string
  expiresAt: string; // ISO 8601 string (sentAt + 24 hours)
  feeAmount?: string;
  dueDate?: string;
  seatNumber?: string;
  branchName?: string;
}

const STORAGE_KEY = 'studyflow_device_broadcast_logs';
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const LOGS_UPDATED_EVENT = 'studyflow_broadcast_logs_updated';

/**
 * Prunes expired logs (> 24 hours old) and returns active logs.
 */
function pruneExpiredLogs(logs: BroadcastLogItem[]): BroadcastLogItem[] {
  const now = Date.now();
  return logs.filter((item) => {
    const sentTime = new Date(item.sentAt).getTime();
    if (isNaN(sentTime)) return false;
    return now - sentTime < TWENTY_FOUR_HOURS_MS;
  });
}

/**
 * Retrieve all local broadcast logs for the device.
 * Automatically purges entries older than 24 hours.
 */
export function getLocalBroadcastLogs(channel?: 'whatsapp' | 'sms' | 'email' | 'all'): BroadcastLogItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: BroadcastLogItem[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const activeLogs = pruneExpiredLogs(parsed);

    // If any expired logs were pruned, persist clean list back to localStorage
    if (activeLogs.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activeLogs));
    }

    // Filter by channel if requested
    const filtered = channel && channel !== 'all'
      ? activeLogs.filter((log) => log.channel === channel)
      : activeLogs;

    // Return sorted newest first
    return filtered.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  } catch (err) {
    console.warn('[BroadcastStorage] Failed to read broadcast logs from localStorage:', err);
    return [];
  }
}

/**
 * Save a single broadcast log entry to local storage.
 * Attaches timestamps and auto-prunes entries older than 24 hours.
 */
export function saveLocalBroadcastLog(
  entry: Omit<BroadcastLogItem, 'id' | 'sentAt' | 'expiresAt'>
): BroadcastLogItem {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing: BroadcastLogItem[] = raw ? JSON.parse(raw) : [];
    const activeLogs = pruneExpiredLogs(Array.isArray(existing) ? existing : []);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + TWENTY_FOUR_HOURS_MS);

    const newLog: BroadcastLogItem = {
      ...entry,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sentAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    activeLogs.unshift(newLog);

    // Keep at most 500 recent items to prevent storage bloat
    const capped = activeLogs.slice(0, 500);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(capped));

    // Notify listeners across the current window
    window.dispatchEvent(new CustomEvent(LOGS_UPDATED_EVENT));

    return newLog;
  } catch (err) {
    console.warn('[BroadcastStorage] Failed to save log to localStorage:', err);
    return {
      ...entry,
      id: `fallback_${Date.now()}`,
      sentAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + TWENTY_FOUR_HOURS_MS).toISOString(),
    };
  }
}

/**
 * Save multiple broadcast log entries at once (e.g., bulk SMS or batch WhatsApp queue).
 */
export function saveMultipleLocalBroadcastLogs(
  entries: Array<Omit<BroadcastLogItem, 'id' | 'sentAt' | 'expiresAt'>>
): BroadcastLogItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing: BroadcastLogItem[] = raw ? JSON.parse(raw) : [];
    const activeLogs = pruneExpiredLogs(Array.isArray(existing) ? existing : []);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + TWENTY_FOUR_HOURS_MS);

    const newLogs: BroadcastLogItem[] = entries.map((entry, idx) => ({
      ...entry,
      id: `log_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      sentAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    }));

    const combined = [...newLogs, ...activeLogs].slice(0, 500);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));

    window.dispatchEvent(new CustomEvent(LOGS_UPDATED_EVENT));

    return newLogs;
  } catch (err) {
    console.warn('[BroadcastStorage] Failed to save batch logs to localStorage:', err);
    return [];
  }
}

/**
 * Delete a specific log item by ID.
 */
export function deleteLocalBroadcastLog(id: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const existing: BroadcastLogItem[] = JSON.parse(raw);
    const updated = existing.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(LOGS_UPDATED_EVENT));
  } catch (err) {
    console.warn('[BroadcastStorage] Failed to delete log:', err);
  }
}

/**
 * Clear all broadcast logs or logs for a specific channel.
 */
export function clearLocalBroadcastLogs(channel?: 'whatsapp' | 'sms' | 'email' | 'all'): void {
  try {
    if (!channel || channel === 'all') {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const existing: BroadcastLogItem[] = JSON.parse(raw);
      const remaining = existing.filter((item) => item.channel !== channel);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
    }
    window.dispatchEvent(new CustomEvent(LOGS_UPDATED_EVENT));
  } catch (err) {
    console.warn('[BroadcastStorage] Failed to clear logs:', err);
  }
}

/**
 * Human-readable format of remaining time before 24-hour auto-deletion.
 */
export function getTimeUntilExpiration(sentAt: string): { label: string; hoursLeft: number; minutesLeft: number } {
  const sentTime = new Date(sentAt).getTime();
  if (isNaN(sentTime)) return { label: 'Expired', hoursLeft: 0, minutesLeft: 0 };

  const expiresTime = sentTime + TWENTY_FOUR_HOURS_MS;
  const diffMs = expiresTime - Date.now();

  if (diffMs <= 0) {
    return { label: 'Expiring now', hoursLeft: 0, minutesLeft: 0 };
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return { label: `Deletes in ${hours}h ${minutes}m`, hoursLeft: hours, minutesLeft: minutes };
  }
  return { label: `Deletes in ${minutes}m`, hoursLeft: 0, minutesLeft: minutes };
}
