import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { UserMessagePreferencesRepository } from '@/lib/repositories/messaging/preferences.repository'
import type { ToneStyle, MessageFrequency } from '@/lib/domain/messaging.types'

const TONE_STYLES: ToneStyle[] = ['coach', 'calm', 'hype', 'minimal']
const MESSAGE_FREQUENCIES: MessageFrequency[] = ['low', 'normal', 'high']

function serializePreferences(prefs: {
  userId: string
  enabled?: boolean
  toneStyle: string
  messageFrequency: string
  quietHoursStart?: string
  quietHoursEnd?: string
  preferredChannels: string[]
  profanityAllowed: boolean
  showReminders?: boolean
  showSystemUpdates?: boolean
  showProgressUpdates?: boolean
  updatedAt: Date
}) {
  return {
    userId: prefs.userId,
    enabled: prefs.enabled !== false,
    toneStyle: prefs.toneStyle,
    messageFrequency: prefs.messageFrequency,
    quietHoursStart: prefs.quietHoursStart ?? null,
    quietHoursEnd: prefs.quietHoursEnd ?? null,
    preferredChannels: prefs.preferredChannels,
    profanityAllowed: prefs.profanityAllowed,
    showReminders: prefs.showReminders !== false,
    showSystemUpdates: prefs.showSystemUpdates !== false,
    showProgressUpdates: prefs.showProgressUpdates !== false,
    updatedAt: prefs.updatedAt.toISOString(),
  }
}

/**
 * GET /api/messages/preferences — return current user message preferences.
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
    const prefs = await UserMessagePreferencesRepository.getByUserId(authResult.userId)
    if (!prefs) {
      return NextResponse.json(
        serializePreferences({
          userId: authResult.userId,
          enabled: true,
          toneStyle: 'calm',
          messageFrequency: 'normal',
          preferredChannels: ['in_app'],
          profanityAllowed: false,
          showReminders: true,
          showSystemUpdates: true,
          showProgressUpdates: true,
          updatedAt: new Date(),
        })
      )
    }
    return NextResponse.json(serializePreferences(prefs))
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to fetch preferences'
    return NextResponse.json({ error: 'Server error', message }, { status: 500 })
  }
}

/**
 * PATCH /api/messages/preferences — update tone, frequency, enabled, quiet hours, channels.
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
  const updates: Parameters<typeof UserMessagePreferencesRepository.upsert>[1] = {}
  if (typeof body.enabled === 'boolean') updates.enabled = body.enabled
  if (typeof body.toneStyle === 'string' && TONE_STYLES.includes(body.toneStyle as ToneStyle)) {
    updates.toneStyle = body.toneStyle as ToneStyle
  }
  if (
    typeof body.messageFrequency === 'string' &&
    MESSAGE_FREQUENCIES.includes(body.messageFrequency as MessageFrequency)
  ) {
    updates.messageFrequency = body.messageFrequency as MessageFrequency
  }
  if (typeof body.quietHoursStart === 'string') updates.quietHoursStart = body.quietHoursStart
  if (typeof body.quietHoursEnd === 'string') updates.quietHoursEnd = body.quietHoursEnd
  if (Array.isArray(body.preferredChannels)) {
    updates.preferredChannels = body.preferredChannels.filter((c): c is string => typeof c === 'string')
  }
  if (typeof body.profanityAllowed === 'boolean') updates.profanityAllowed = body.profanityAllowed
  if (typeof body.showReminders === 'boolean') updates.showReminders = body.showReminders
  if (typeof body.showSystemUpdates === 'boolean') updates.showSystemUpdates = body.showSystemUpdates
  if (typeof body.showProgressUpdates === 'boolean') updates.showProgressUpdates = body.showProgressUpdates

  try {
    const prefs = await UserMessagePreferencesRepository.upsert(authResult.userId, updates)
    return NextResponse.json(serializePreferences(prefs))
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to update preferences'
    return NextResponse.json({ error: 'Server error', message }, { status: 500 })
  }
}
