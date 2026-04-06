/**
 * App-owned AI error codes (normalized for API + UI). Never expose provider stack traces.
 */
export const AI_ERROR_CODE = {
  RATE_LIMITED: 'RATE_LIMITED',
  INVALID_PROVIDER_CONFIGURATION: 'INVALID_PROVIDER_CONFIGURATION',
  PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
  PROVIDER_RESPONSE_FAILED: 'PROVIDER_RESPONSE_FAILED',
} as const

export type AIErrorCode = (typeof AI_ERROR_CODE)[keyof typeof AI_ERROR_CODE]

export class AITrainerServiceError extends Error {
  constructor(
    public readonly code: AIErrorCode,
    message: string,
    public readonly httpStatus: number = 500
  ) {
    super(message)
    this.name = 'AITrainerServiceError'
  }
}

export function isAITrainerServiceError(e: unknown): e is AITrainerServiceError {
  return e instanceof AITrainerServiceError
}
