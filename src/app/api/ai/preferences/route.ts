import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { AiProviderPreferencesRepository } from '@/lib/repositories/ai/ai-provider-preferences.repository'
import { AiProviderRouter } from '@/lib/services/ai/ai-provider-router.service'
import type { AiRoutingProvider } from '@/lib/repositories/ai/ai-provider-preferences.repository'

function availabilityPayload() {
  const a = AiProviderRouter.getProviderAvailability()
  return {
    openai: { usable: a.openai.usable },
    anthropic: { usable: a.anthropic.usable },
  }
}

/**
 * GET /api/ai/preferences
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return NextResponse.json(
      { error: 'Unauthorized', message: authResult.error },
      { status: 401 }
    )
  }

  try {
    const prefs = await AiProviderPreferencesRepository.getByUserId(authResult.userId)
    return NextResponse.json({
      defaultProvider: prefs?.defaultProvider ?? null,
      fallbackProvider: prefs?.fallbackProvider ?? null,
      allowFallback: prefs?.allowFallback ?? false,
      availability: availabilityPayload(),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to load preferences'
    return NextResponse.json({ error: 'Server error', message: msg }, { status: 500 })
  }
}

/**
 * PATCH /api/ai/preferences
 * Body: { defaultProvider?, fallbackProvider?, allowFallback? }
 */
export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return NextResponse.json(
      { error: 'Unauthorized', message: authResult.error },
      { status: 401 }
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Bad request', message: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const allowFallback =
    typeof body.allowFallback === 'boolean' ? body.allowFallback : undefined

  let defInvalid = false
  let fbInvalid = false
  if (Object.prototype.hasOwnProperty.call(body, 'defaultProvider')) {
    const v = body.defaultProvider
    if (v !== null && v !== 'openai' && v !== 'anthropic') defInvalid = true
  }
  if (Object.prototype.hasOwnProperty.call(body, 'fallbackProvider')) {
    const v = body.fallbackProvider
    if (v !== null && v !== 'openai' && v !== 'anthropic') fbInvalid = true
  }
  if (defInvalid || fbInvalid) {
    return NextResponse.json(
      { error: 'Bad request', message: 'defaultProvider and fallbackProvider must be openai, anthropic, or null' },
      { status: 400 }
    )
  }

  const def =
    Object.prototype.hasOwnProperty.call(body, 'defaultProvider') && body.defaultProvider === null
      ? null
      : Object.prototype.hasOwnProperty.call(body, 'defaultProvider')
        ? (body.defaultProvider as AiRoutingProvider)
        : undefined
  const fb =
    Object.prototype.hasOwnProperty.call(body, 'fallbackProvider') && body.fallbackProvider === null
      ? null
      : Object.prototype.hasOwnProperty.call(body, 'fallbackProvider')
        ? (body.fallbackProvider as AiRoutingProvider)
        : undefined

  if (def === undefined && fb === undefined && allowFallback === undefined) {
    return NextResponse.json(
      { error: 'Bad request', message: 'No valid fields to update' },
      { status: 400 }
    )
  }

  const existing = await AiProviderPreferencesRepository.getByUserId(authResult.userId)
  const nextDefault = def !== undefined ? def : existing?.defaultProvider ?? null
  const nextFallback = fb !== undefined ? fb : existing?.fallbackProvider ?? null
  const nextAllow = allowFallback !== undefined ? allowFallback : existing?.allowFallback ?? false

  if (
    nextDefault != null &&
    nextFallback != null &&
    nextDefault === nextFallback &&
    nextAllow
  ) {
    return NextResponse.json(
      {
        error: 'Bad request',
        message: 'Default provider and fallback provider must be different when fallback is enabled.',
        errorCode: 'INVALID_PROVIDER_CONFIGURATION',
      },
      { status: 400 }
    )
  }

  try {
    const saved = await AiProviderPreferencesRepository.upsert({
      userId: authResult.userId,
      defaultProvider: nextDefault,
      fallbackProvider: nextFallback,
      allowFallback: nextAllow,
    })
    return NextResponse.json({
      defaultProvider: saved.defaultProvider,
      fallbackProvider: saved.fallbackProvider,
      allowFallback: saved.allowFallback,
      availability: availabilityPayload(),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to save preferences'
    return NextResponse.json({ error: 'Server error', message: msg }, { status: 500 })
  }
}
