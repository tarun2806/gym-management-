import { api } from './api';

/**
 * Write an audit entry via the backend. Fire-and-forget: if the write
 * fails (network, auth, offline) the error is caught and logged to console
 * but never propagated — an audit failure must not break the parent
 * operation.
 */
export async function logAudit(
  level: 'info' | 'warning' | 'error',
  message: string,
  userName: string,
  action: string,
): Promise<void> {
  try {
    await api('/api/admin/logs', {
      method: 'POST',
      body: { level, message, user_name: userName, action },
    });
  } catch (err) {
    // Intentionally swallowed: audit must never be a blocking dependency.
    console.error('[audit] write failed:', err);
  }
}
