'use client'

/**
 * DPS-6 showcase — static UI fixtures only (no APIs, no simulated AI responses).
 */

import { useCallback, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DpsAiInsightCard, DpsChatContainer, DpsChatInputBar, DpsChatMessageBubble, DpsInlineRecommendation, DpsPageHeader, DpsPageSection } from '@/components/dps'

type DemoMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export default function Dps6AiDemoPage() {
  const [input, setInput] = useState('')
  const [showThinking, setShowThinking] = useState(true)

  const messages = useMemo<DemoMessage[]>(
    () => [
      {
        id: 'fixture-user-1',
        role: 'user',
        content: 'Fixture question: How can I improve consistency this week?',
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
    ],
    []
  )

  const formatTimestamp = useCallback((iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  }, [])

  const handleSend = useCallback(async () => {
    // No AI/backend in this demo: keep it purely UI.
    setInput('')
  }, [])

  return (
    <div className="dps-section-y">
      <DpsPageHeader
        title="DPS-6 — AI Interface UI"
        description="Chat layout + bubbles + thinking indicator + insight blocks. UI-only fixtures."
        titleId="dps6-demo"
      />

      <DpsPageSection>
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Chat UI</CardTitle>
            <CardDescription>Assistant thinking indicator is driven by local toggle only.</CardDescription>
          </CardHeader>
          <CardContent className="dps-stack-y">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant={showThinking ? 'secondary' : 'outline'} size="sm" onClick={() => setShowThinking(true)}>
                Show thinking
              </Button>
              <Button type="button" variant={!showThinking ? 'secondary' : 'outline'} size="sm" onClick={() => setShowThinking(false)}>
                Hide thinking
              </Button>
            </div>

            <Card className="bg-transparent border-border/60 shadow-none">
              <CardContent className="p-0">
                <DpsChatContainer
                  inputSlot={
                    <DpsChatInputBar
                      value={input}
                      onChange={setInput}
                      onSend={handleSend}
                      placeholder="Demo input (no backend)"
                      isSending={false}
                    />
                  }
                >
                  <ul className="space-y-4 py-4" role="list">
                    {messages.map((m) => (
                      <li key={m.id}>
                        <DpsChatMessageBubble role={m.role} text={m.content} timestamp={formatTimestamp(m.createdAt)} />
                      </li>
                    ))}
                    {showThinking ? (
                      <li key="fixture-thinking">
                        <DpsChatMessageBubble role="assistant" text="" isLoading />
                      </li>
                    ) : null}
                  </ul>
                </DpsChatContainer>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </DpsPageSection>

      <DpsPageSection>
        <DpsAiInsightCard
          title="AI insight (fixture)"
          insightText={
            <>
              <p className="text-k-sm text-muted-foreground mb-2">Example contextual insight copy (UI-only).</p>
              <p className="text-sm text-muted-foreground">Try logging food earlier and start your day with a quick meal.</p>
            </>
          }
          ctaLabel="Open chat"
          onCta={() => {}}
        />
      </DpsPageSection>

      <DpsPageSection>
        <DpsInlineRecommendation
          text="You're close to your protein goal today (fixture)."
          actionLabel="View nutrition"
          onAction={() => {}}
        />
      </DpsPageSection>
    </div>
  )
}

