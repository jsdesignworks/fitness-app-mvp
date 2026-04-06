'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DpsMessageCard,
  DpsMessageGroup,
  DpsMessageList,
  DpsNotificationBanner,
  DpsPageHeader,
  DpsPageSection,
  DpsToggleField,
  dpsToast,
} from '@/components/dps'
import type { DpsMessageTone } from '@/components/dps/messaging/dps-message-types'

type ApiMessage = {
  id: string
  triggerKey: string
  renderedBody: string
  title: string | null
  messageType: string
  tone: string
  ctaLabel: string | null
  ctaHref: string | null
  isRead: boolean
  createdAt: string
}

type Preferences = {
  enabled: boolean
  toneStyle: string
  messageFrequency: string
  showReminders: boolean
  showSystemUpdates: boolean
  showProgressUpdates: boolean
  updatedAt: string
}

function toTone(t: string): DpsMessageTone {
  if (t === 'success' || t === 'warning' || t === 'error' || t === 'system' || t === 'info') return t
  return 'info'
}

function formatTimestamp(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function bucketForMessage(iso: string): 'today' | 'yesterday' | 'older' {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const ds = (x: Date) => x.toDateString()
  if (ds(d) === ds(today)) return 'today'
  if (ds(d) === ds(yesterday)) return 'yesterday'
  return 'older'
}

export default function MessagesPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<ApiMessage[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [feedEnabled, setFeedEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [preferences, setPreferences] = useState<Preferences | null>(null)
  const [prefsLoading, setPrefsLoading] = useState(true)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [prefsForm, setPrefsForm] = useState({
    enabled: true,
    toneStyle: 'calm',
    messageFrequency: 'normal',
    showReminders: true,
    showSystemUpdates: true,
    showProgressUpdates: true,
  })

  const fetchMessages = useCallback(async () => {
    const res = await fetch('/api/messages?limit=80')
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(typeof data.message === 'string' ? data.message : 'Failed to load messages')
      return
    }
    const data = await res.json()
    setMessages(data.messages ?? data.events ?? [])
    setUnreadCount(data.unreadCount ?? 0)
    setFeedEnabled(data.feedEnabled !== false)
    setError(null)
  }, [])

  const fetchPreferences = useCallback(async () => {
    const res = await fetch('/api/messages/preferences')
    if (!res.ok) return
    const data = await res.json()
    setPreferences(data)
    setPrefsForm({
      enabled: data.enabled !== false,
      toneStyle: data.toneStyle ?? 'calm',
      messageFrequency: data.messageFrequency ?? 'normal',
      showReminders: data.showReminders !== false,
      showSystemUpdates: data.showSystemUpdates !== false,
      showProgressUpdates: data.showProgressUpdates !== false,
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchMessages().finally(() => setLoading(false))
  }, [fetchMessages])

  useEffect(() => {
    setPrefsLoading(true)
    fetchPreferences().finally(() => setPrefsLoading(false))
  }, [fetchPreferences])

  const markRead = useCallback(
    async (id: string) => {
      const prev = messages
      const wasUnread = prev.some((x) => x.id === id && !x.isRead)
      setMessages((m) => m.map((x) => (x.id === id ? { ...x, isRead: true } : x)))
      try {
        const res = await fetch(`/api/messages/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isRead: true }),
        })
        if (!res.ok) throw new Error('Failed')
        if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1))
      } catch {
        setMessages(prev)
        dpsToast.destructive({ title: 'Could not mark as read', description: 'Try again.' })
      }
    },
    [messages]
  )

  const dismissMessage = useCallback(
    async (id: string) => {
      const prev = messages
      setMessages((m) => m.filter((x) => x.id !== id))
      try {
        const res = await fetch(`/api/messages/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isDismissed: true }),
        })
        if (!res.ok) throw new Error('Failed')
        const dismissed = prev.find((x) => x.id === id)
        if (dismissed && !dismissed.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1))
        }
      } catch {
        setMessages(prev)
        dpsToast.destructive({ title: 'Could not dismiss', description: 'Try again.' })
      }
    },
    [messages]
  )

  const handleSavePreferences = async () => {
    setSavingPrefs(true)
    try {
      const res = await fetch('/api/messages/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: prefsForm.enabled,
          toneStyle: prefsForm.toneStyle,
          messageFrequency: prefsForm.messageFrequency,
          showReminders: prefsForm.showReminders,
          showSystemUpdates: prefsForm.showSystemUpdates,
          showProgressUpdates: prefsForm.showProgressUpdates,
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      const data = await res.json()
      setPreferences(data)
      dpsToast.success({ title: 'Preferences saved' })
      await fetchMessages()
    } catch {
      dpsToast.destructive({ title: 'Could not save preferences' })
    } finally {
      setSavingPrefs(false)
    }
  }

  const grouped = useMemo(() => {
    const today: ApiMessage[] = []
    const yesterday: ApiMessage[] = []
    const older: ApiMessage[] = []
    for (const m of messages) {
      const b = bucketForMessage(m.createdAt)
      if (b === 'today') today.push(m)
      else if (b === 'yesterday') yesterday.push(m)
      else older.push(m)
    }
    return { today, yesterday, older }
  }, [messages])

  const showEmpty = feedEnabled && !loading && !error && messages.length === 0

  return (
    <div className="dps-section-y max-w-3xl">
      <DpsPageHeader
        title="Messages"
        description="System updates and activity-aware notices from your training and nutrition data."
        titleId="messages-title"
      />

      <DpsPageSection>
        <Card variant="elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-k-lg flex items-center gap-2">
              <Settings2 className="h-4 w-4" aria-hidden />
              Preferences
            </CardTitle>
            <CardDescription>
              Control in-app messages and categories. Tone applies to template-based messages when sent.
            </CardDescription>
          </CardHeader>
          <CardContent className="dps-stack-y">
            {!prefsLoading && (
              <>
                <DpsToggleField
                  label="Enable in-app messages"
                  description="When off, the feed stays empty and live notices are not synced."
                  checked={prefsForm.enabled}
                  onCheckedChange={(enabled) => setPrefsForm((p) => ({ ...p, enabled }))}
                />
                <DpsToggleField
                  label="Reminders"
                  description="e.g. resume an in-progress workout."
                  checked={prefsForm.showReminders}
                  onCheckedChange={(showReminders) => setPrefsForm((p) => ({ ...p, showReminders }))}
                  disabled={!prefsForm.enabled}
                />
                <DpsToggleField
                  label="System updates"
                  description="Nutrition and calendar summaries from your real logs."
                  checked={prefsForm.showSystemUpdates}
                  onCheckedChange={(showSystemUpdates) => setPrefsForm((p) => ({ ...p, showSystemUpdates }))}
                  disabled={!prefsForm.enabled}
                />
                <DpsToggleField
                  label="Progress updates"
                  description="Reserved for milestone-style messages when wired."
                  checked={prefsForm.showProgressUpdates}
                  onCheckedChange={(showProgressUpdates) =>
                    setPrefsForm((p) => ({ ...p, showProgressUpdates }))
                  }
                  disabled={!prefsForm.enabled}
                />
                <div className="grid gap-2 max-w-xs">
                  <span className="text-k-sm font-medium text-foreground">Tone</span>
                  <Select
                    value={prefsForm.toneStyle}
                    onValueChange={(v) => setPrefsForm((p) => ({ ...p, toneStyle: v }))}
                    disabled={!prefsForm.enabled}
                  >
                    <SelectTrigger className="dps-focus-ring">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coach">Coach</SelectItem>
                      <SelectItem value="calm">Calm</SelectItem>
                      <SelectItem value="hype">Hype</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2 max-w-xs">
                  <span className="text-k-sm font-medium text-foreground">Frequency</span>
                  <Select
                    value={prefsForm.messageFrequency}
                    onValueChange={(v) => setPrefsForm((p) => ({ ...p, messageFrequency: v }))}
                    disabled={!prefsForm.enabled}
                  >
                    <SelectTrigger className="dps-focus-ring">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  onClick={handleSavePreferences}
                  disabled={savingPrefs}
                  className="w-fit dps-focus-ring"
                >
                  {savingPrefs ? 'Saving…' : 'Save preferences'}
                </Button>
                {preferences ? (
                  <p className="text-k-xs text-muted-foreground">
                    Last updated {new Date(preferences.updatedAt).toLocaleString()}
                  </p>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </DpsPageSection>

      <DpsPageSection>
        <Card variant="elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-k-lg flex items-center gap-2">
              <MessageCircle className="h-4 w-4" aria-hidden />
              Feed
              {unreadCount > 0 ? (
                <span className="rounded-full bg-accent/20 px-2 py-0.5 text-k-xs font-medium text-accent">
                  {unreadCount} unread
                </span>
              ) : null}
            </CardTitle>
            <CardDescription>Newest first. Dismiss to hide; opening a card marks it read.</CardDescription>
          </CardHeader>
          <CardContent>
            <DpsMessageList
              isLoading={loading}
              error={error}
              onRetry={() => {
                setLoading(true)
                void fetchMessages().finally(() => setLoading(false))
              }}
              empty={showEmpty}
              emptyTitle="No messages"
              emptyDescription="When you complete workouts or when synced notices apply, they will appear here."
              emptyIcon={<MessageCircle className="h-10 w-10" />}
            >
              {!feedEnabled && !loading && !error ? (
                <DpsNotificationBanner tone="warning" title="In-app messages are disabled">
                  Turn messaging back on in preferences above to sync activity-aware notices.
                </DpsNotificationBanner>
              ) : null}
              {feedEnabled && messages.length > 0 ? (
                <div className="dps-stack-y">
                  {grouped.today.length > 0 ? (
                    <DpsMessageGroup label="Today" labelId="msg-group-today">
                      <div role="list" className="dps-stack-y">
                        {grouped.today.map((m) => (
                          <MessageRow
                            key={m.id}
                            message={m}
                            onMarkRead={markRead}
                            onDismiss={dismissMessage}
                            router={router}
                          />
                        ))}
                      </div>
                    </DpsMessageGroup>
                  ) : null}
                  {grouped.yesterday.length > 0 ? (
                    <DpsMessageGroup label="Yesterday" labelId="msg-group-yesterday">
                      <div role="list" className="dps-stack-y">
                        {grouped.yesterday.map((m) => (
                          <MessageRow
                            key={m.id}
                            message={m}
                            onMarkRead={markRead}
                            onDismiss={dismissMessage}
                            router={router}
                          />
                        ))}
                      </div>
                    </DpsMessageGroup>
                  ) : null}
                  {grouped.older.length > 0 ? (
                    <DpsMessageGroup label="Older" labelId="msg-group-older">
                      <div role="list" className="dps-stack-y">
                        {grouped.older.map((m) => (
                          <MessageRow
                            key={m.id}
                            message={m}
                            onMarkRead={markRead}
                            onDismiss={dismissMessage}
                            router={router}
                          />
                        ))}
                      </div>
                    </DpsMessageGroup>
                  ) : null}
                </div>
              ) : null}
            </DpsMessageList>
          </CardContent>
        </Card>
      </DpsPageSection>
    </div>
  )
}

function MessageRow({
  message,
  onMarkRead,
  onDismiss,
  router,
}: {
  message: ApiMessage
  onMarkRead: (id: string) => void
  onDismiss: (id: string) => void
  router: ReturnType<typeof useRouter>
}) {
  const m = message
  const tone = toTone(m.tone)
  const readState = m.isRead ? 'read' : 'unread'

  return (
    <div role="listitem">
      <div
        role="button"
        tabIndex={0}
        className="rounded-lg outline-none dps-focus-ring"
        onClick={() => {
          if (!m.isRead) onMarkRead(m.id)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (!m.isRead) onMarkRead(m.id)
          }
        }}
      >
        <DpsMessageCard
        title={m.title ?? undefined}
        body={m.renderedBody}
        timestamp={formatTimestamp(m.createdAt)}
        tone={tone}
        readState={readState}
        onDismiss={() => onDismiss(m.id)}
        dismissLabel="Dismiss message"
        primaryAction={
          m.ctaHref && m.ctaLabel
            ? {
                label: m.ctaLabel,
                onClick: () => {
                  if (!m.isRead) onMarkRead(m.id)
                  router.push(m.ctaHref!)
                },
              }
            : undefined
        }
      />
      </div>
    </div>
  )
}
