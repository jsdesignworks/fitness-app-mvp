/**
 * Shared domain types for Result pattern
 */

export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E }

export function ok<T>(data: T): Result<T> {
  return { success: true, data }
}

export function err<E = Error>(error: E): Result<never, E> {
  return { success: false, error }
}
