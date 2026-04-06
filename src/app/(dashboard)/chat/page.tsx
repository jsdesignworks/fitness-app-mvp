'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MessageCircle, Settings2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  DpsAiInsightCard,
  DpsChatContainer,
  DpsChatInputBar,
  DpsChatMessageBubble,
  DpsInlineRecommendation,
  DpsToggleField,
} from '@/components/dps'
import { AI_ERROR_CODE } from '@/lib/services/ai/ai-errors'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

type AiContextPreview = {
  summaryLines: string[]
  insightTitle: string
  insightBody: string
  inlineHint?: string
}

type ConversationRow = { id: string; updatedAt: string; createdAt: string }

const SESSION_HINT_KEY = 'jdsw_ai_trainer_session_hint'

const QUICK_PROMPTS = [
  {
    label: 'Explain today’s workout',
    message:
      'Explain my workout today. What did I do and how does it help?',
  },
  {
    label: 'Suggest next session',
    message:
      'Based on my recent activity and schedule, suggest what I should do for my next workout.',
  },
  {
    label: 'Give encouragement',
    message:
      'Give me some encouragement based on my recent adherence and habits.',
  },
] as const

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [contextPreview, setContextPreview] = useState<AiContextPreview | null>(null)
  const [prefsOpen, setPrefsOpen] = useState(false)
  const [prefsLoading, setPrefsLoading] = useState(false)
  const [prefsSaving, setPrefsSaving] = useState(false)
  const [defaultProvider, setDefaultProvider] = useState<string>('auto')
  const [fallbackProvider, setFallbackProvider] = useState<string>('none')
  const [allowFallback, setAllowFallback] = useState(false)
  const [availability, setAvailability] = useState<{
    openai: { usable: boolean }
    anthropic: { usable: boolean }
  } | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const persistSessionHint = useCallback((id: string | null) => {
    try {
      if (id) localStorage.setItem(SESSION_HINT_KEY, id)
      else localStorage.removeItem(SESSION_HINT_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const mapMessages = useCallback(
    (raw: { id: string; role: string; content: string; createdAt: string }[]): ChatMessage[] =>
      raw.map((m) => ({
        id: m.id,
        role: (m.role === 'user' ? 'user' : 'assistant') as ChatMessage['role'],
        content: m.content,
        createdAt: m.createdAt,
      })),
    []
  )

  const loadConversationMessages = useCallback(
    async (sid: string): Promise<ChatMessage[]> => {
      const res = await fetch(`/api/ai/conversations/${encodeURIComponent(sid)}`)
      if (!res.ok) return []
      const data = await res.json()
      if (data.contextPreview) setContextPreview(data.contextPreview as AiContextPreview)
      return mapMessages(data.messages ?? [])
    },
    [mapMessages]
  )

  const bootstrap = useCallback(async () => {
    setLoadingHistory(true)
    setError(null)
    setErrorCode(null)
    try {
      let hint: string | null = null
      try {
        hint = localStorage.getItem(SESSION_HINT_KEY)
      } catch {
        hint = null
      }

      const listRes = await fetch('/api/ai/conversations')
      if (!listRes.ok) throw new Error('Failed to load conversations')
      const listData = await listRes.json()
      const conversations: ConversationRow[] = listData.conversations ?? []
      if (listData.contextPreview) {
        setContextPreview(listData.contextPreview as AiContextPreview)
      }

      const hintOk = hint && conversations.some((c) => c.id === hint)
      const pick =
        hintOk && hint ? hint : conversations.length > 0 ? conversations[0].id : null

      if (pick) {
        setSessionId(pick)
        persistSessionHint(pick)
        const msgs = await loadConversationMessages(pick)
        setMessages(msgs)
      } else {
        setSessionId(null)
        persistSessionHint(null)
        setMessages([])
      }
    } catch {
      setError('Failed to load chat history')
    } finally {
      setLoadingHistory(false)
    }
  }, [loadConversationMessages, persistSessionHint])

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading, scrollToBottom])

  const openPrefs = useCallback(async () => {
    setPrefsOpen(true)
    setPrefsLoading(true)
    try {
      const res = await fetch('/api/ai/preferences')
      if (!res.ok) throw new Error('Failed to load preferences')
      const data = await res.json()
      setDefaultProvider(
        data.defaultProvider === 'openai' || data.defaultProvider === 'anthropic'
          ? data.defaultProvider
          : 'auto'
      )
      setFallbackProvider(
        data.fallbackProvider === 'openai' || data.fallbackProvider === 'anthropic'
          ? data.fallbackProvider
          : 'none'
      )
      setAllowFallback(Boolean(data.allowFallback))
      if (data.availability) setAvailability(data.availability)
    } catch {
      toast({ title: 'Could not load preferences', variant: 'destructive' })
    } finally {
      setPrefsLoading(false)
    }
  }, [toast])

  const savePrefs = useCallback(async () => {
    if (allowFallback && defaultProvider !== 'auto' && fallbackProvider !== 'none') {
      if (defaultProvider === fallbackProvider) {
        toast({
          title: 'Invalid selection',
          description: 'Default and fallback must be different when fallback is enabled.',
          variant: 'destructive',
        })
        return
      }
    }
    setPrefsSaving(true)
    try {
      const res = await fetch('/api/ai/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultProvider:
            defaultProvider === 'auto' ? null : defaultProvider,
          fallbackProvider:
            fallbackProvider === 'none' ? null : fallbackProvider,
          allowFallback,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message ?? 'Save failed')
      }
      if (data.availability) setAvailability(data.availability)
      toast({ title: 'Saved', description: 'AI provider preferences updated.' })
      setPrefsOpen(false)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Save failed'
      toast({ title: 'Could not save', description: msg, variant: 'destructive' })
    } finally {
      setPrefsSaving(false)
    }
  }, [allowFallback, defaultProvider, fallbackProvider, toast])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading) return

      const userMsg: ChatMessage = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userMsg])
      setInput('')
      setLoading(true)
      setError(null)
      setErrorCode(null)

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            ...(sessionId && { sessionId }),
          }),
        })
        const data = await res.json()

        const code = typeof data.errorCode === 'string' ? data.errorCode : null

        if (!res.ok) {
          setErrorCode(code)
          if (code === AI_ERROR_CODE.RATE_LIMITED) {
            setError(data.message ?? 'Rate limit reached. Try again later.')
          } else if (
            code === AI_ERROR_CODE.INVALID_PROVIDER_CONFIGURATION ||
            code === AI_ERROR_CODE.PROVIDER_UNAVAILABLE
          ) {
            setError(
              data.message ??
                'AI is not configured correctly. Open provider settings to adjust.'
            )
          } else if (code === AI_ERROR_CODE.PROVIDER_RESPONSE_FAILED) {
            setError(data.message ?? 'The AI did not return a valid response.')
          } else {
            setError(data.message ?? 'Something went wrong')
          }
          setMessages((prev) => prev.filter((m) => m.id !== userMsg.id))
          return
        }

        if (data.sessionId) {
          setSessionId(data.sessionId)
          persistSessionHint(data.sessionId)
        }
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response?.content ?? 'No response.',
          createdAt: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, assistantMsg])
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Something went wrong'
        setError(message)
        setErrorCode(null)
        toast({ title: 'Error', description: message, variant: 'destructive' })
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id))
      } finally {
        setLoading(false)
      }
    },
    [loading, sessionId, toast, persistSessionHint]
  )

  const handleQuickPrompt = (message: string) => {
    void sendMessage(message)
  }

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  }

  const showPrefsCta =
    errorCode === AI_ERROR_CODE.INVALID_PROVIDER_CONFIGURATION ||
    errorCode === AI_ERROR_CODE.PROVIDER_UNAVAILABLE

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Trainer</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Get explanations, suggestions, and encouragement based on your workouts and habits.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="dps-focus-ring shrink-0"
          onClick={() => void openPrefs()}
        >
          <Settings2 className="h-4 w-4 mr-2" />
          Provider settings
        </Button>
      </div>

      <Card className="flex flex-col max-h-[calc(100vh-16rem)]">
        <CardHeader className="pb-3 shrink-0">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Chat
          </CardTitle>
          <CardDescription>
            Ask for help or use a quick prompt below. Your recent activity and schedule are included for context.
          </CardDescription>
          <div className="flex flex-wrap gap-2 pt-2">
            {QUICK_PROMPTS.map(({ label, message }) => (
              <Button
                key={label}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handleQuickPrompt(message)}
                disabled={loading}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                {label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 min-h-0 p-0">
          <DpsChatContainer
            inputSlot={
              <DpsChatInputBar
                value={input}
                onChange={setInput}
                onSend={sendMessage}
                placeholder="Ask about your workout, schedule, or habits…"
                disabled={loadingHistory}
                isSending={loading}
              />
            }
          >
            {loadingHistory && !messages.length && (
              <p className="text-sm text-muted-foreground py-4">Loading…</p>
            )}
            {!loadingHistory && !messages.length && !error && contextPreview && (
              <div className="space-y-4 py-4">
                <DpsAiInsightCard
                  title={contextPreview.insightTitle}
                  insightText={
                    <div className="space-y-2">
                      <p>{contextPreview.insightBody}</p>
                      <ul className="list-disc pl-5 space-y-1 text-k-sm">
                        {contextPreview.summaryLines.slice(0, 5).map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  }
                  ctaLabel="Provider settings"
                  onCta={() => void openPrefs()}
                />
                {contextPreview.inlineHint ? (
                  <DpsInlineRecommendation
                    text={contextPreview.inlineHint}
                    actionLabel="Open provider settings"
                    onAction={() => void openPrefs()}
                  />
                ) : null}
              </div>
            )}
            {!loadingHistory && !messages.length && !error && !contextPreview && (
              <p className="text-sm text-muted-foreground py-4">
                No context preview yet. Send a message to start.
              </p>
            )}
            {error && !messages.length && (
              <div className="space-y-3 py-4">
                <p className="text-sm text-destructive">{error}</p>
                {showPrefsCta ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => void openPrefs()}>
                    Open provider settings
                  </Button>
                ) : null}
                {errorCode === AI_ERROR_CODE.RATE_LIMITED ? (
                  <p className="text-k-sm text-muted-foreground">
                    Wait a bit and try again. The limit resets each hour.
                  </p>
                ) : null}
              </div>
            )}
            <ul className="space-y-4 py-4" role="list">
              {messages.map((m) => (
                <li key={m.id}>
                  <DpsChatMessageBubble
                    role={m.role}
                    text={m.content}
                    timestamp={formatTimestamp(m.createdAt)}
                  />
                </li>
              ))}
              {loading && messages.length && messages[messages.length - 1].role === 'user' ? (
                <li key="dps6-thinking">
                  <DpsChatMessageBubble role="assistant" text="" isLoading />
                </li>
              ) : null}
            </ul>
            <div ref={messagesEndRef} />
          </DpsChatContainer>
        </CardContent>
      </Card>

      <Dialog open={prefsOpen} onOpenChange={setPrefsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>AI provider routing</DialogTitle>
            <DialogDescription>
              Choose how requests are routed. The app needs valid API keys on the server for each provider you use.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {availability ? (
              <p className="text-k-sm text-muted-foreground">
                Status: OpenAI {availability.openai.usable ? 'ready' : 'not configured'} · Anthropic{' '}
                {availability.anthropic.usable ? 'ready' : 'not configured'}
              </p>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="ai-default-provider">Default provider</Label>
              <Select
                value={defaultProvider}
                onValueChange={setDefaultProvider}
                disabled={prefsLoading}
              >
                <SelectTrigger id="ai-default-provider" className="dps-focus-ring">
                  <SelectValue placeholder="Auto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (recommended)</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DpsToggleField
              label="Allow fallback"
              description="If the primary provider fails, try the fallback once."
              checked={allowFallback}
              onCheckedChange={setAllowFallback}
              disabled={prefsLoading}
            />
            <div className="space-y-2">
              <Label htmlFor="ai-fallback-provider">Fallback provider</Label>
              <Select
                value={fallbackProvider}
                onValueChange={setFallbackProvider}
                disabled={prefsLoading || !allowFallback}
              >
                <SelectTrigger id="ai-fallback-provider" className="dps-focus-ring">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPrefsOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void savePrefs()} disabled={prefsSaving || prefsLoading}>
              {prefsSaving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
