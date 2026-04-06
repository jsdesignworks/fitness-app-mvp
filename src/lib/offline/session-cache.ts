/**
 * Offline cache for the active workout session.
 * - Persist session snapshot on successful fetch
 * - Queue failed mutations (add set, update set) and retry when online
 * - Complete/abandon must be done online (caller checks navigator.onLine)
 */

const SESSION_KEY_PREFIX = 'fitness_active_session_'
const QUEUE_KEY_PREFIX = 'fitness_session_queue_'

export type CachedSession = Record<string, unknown>

export const SessionCache = {
  get(sessionId: string): CachedSession | null {
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem(SESSION_KEY_PREFIX + sessionId)
      return raw ? (JSON.parse(raw) as CachedSession) : null
    } catch {
      return null
    }
  },

  set(sessionId: string, session: CachedSession): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(SESSION_KEY_PREFIX + sessionId, JSON.stringify(session))
    } catch {
      // quota or private mode
    }
  },

  clear(sessionId: string): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(SESSION_KEY_PREFIX + sessionId)
      localStorage.removeItem(QUEUE_KEY_PREFIX + sessionId)
    } catch {}
  },

  /** Queue a failed mutation to retry later */
  enqueueMutation(
    sessionId: string,
    mutation: { type: 'add_set' | 'update_set'; payload: unknown }
  ): void {
    if (typeof window === 'undefined') return
    try {
      const key = QUEUE_KEY_PREFIX + sessionId
      const raw = localStorage.getItem(key)
      const queue: Array<{ type: string; payload: unknown }> = raw ? JSON.parse(raw) : []
      queue.push(mutation)
      localStorage.setItem(key, JSON.stringify(queue))
    } catch {}
  },

  getMutationQueue(sessionId: string): Array<{ type: string; payload: unknown }> {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem(QUEUE_KEY_PREFIX + sessionId)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  },

  setMutationQueue(
    sessionId: string,
    queue: Array<{ type: string; payload: unknown }>
  ): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(QUEUE_KEY_PREFIX + sessionId, JSON.stringify(queue))
    } catch {
      // Ignore quota/private mode failures.
    }
  },

  clearMutationQueue(sessionId: string): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(QUEUE_KEY_PREFIX + sessionId)
    } catch {}
  },
}
