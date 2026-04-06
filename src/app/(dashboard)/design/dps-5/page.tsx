'use client'

/**
 * DPS-5 showcase — static copy and local UI state only (no APIs or fake message feeds).
 */

import { useCallback, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  DpsMessageCard,
  DpsMessageGroup,
  DpsMessageList,
  DpsNotificationBanner,
  DpsPageHeader,
  DpsPageSection,
  dpsToast,
} from '@/components/dps'

type ListDemo = 'populated' | 'loading' | 'error' | 'empty'

export default function Dps5MessagingDemoPage() {
  const [listDemo, setListDemo] = useState<ListDemo>('populated')
  const [bannerVisible, setBannerVisible] = useState(true)

  const showToastSuccess = useCallback(() => {
    dpsToast.success({
      title: 'Sample success',
      description: 'Transient toast — same stack as the rest of the app.',
    })
  }, [])

  const showToastWarning = useCallback(() => {
    dpsToast.warning({
      title: 'Sample warning',
      description: 'Use for recoverable issues.',
    })
  }, [])

  const showToastInfo = useCallback(() => {
    dpsToast.info({
      title: 'Sample info',
      description: 'Neutral context.',
    })
  }, [])

  return (
    <div className="dps-section-y">
      <DpsPageHeader
        title="DPS-5 — Communication UI"
        description="Message surfaces, banners, and toasts. No backend."
        titleId="dps5-title"
      />

      <DpsPageSection>
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Notification banner</CardTitle>
            <CardDescription>Inline strip — dismiss hides this sample.</CardDescription>
          </CardHeader>
          <CardContent className="dps-stack-y">
            {bannerVisible ? (
              <DpsNotificationBanner
                tone="info"
                title="System notice"
                onDismiss={() => setBannerVisible(false)}
              >
                This is static placeholder copy for layout QA only.
              </DpsNotificationBanner>
            ) : (
              <Button type="button" variant="outline" size="sm" onClick={() => setBannerVisible(true)}>
                Show banner again
              </Button>
            )}
            <DpsNotificationBanner tone="success" title="Saved">
              Short success copy for comparison.
            </DpsNotificationBanner>
            <DpsNotificationBanner tone="error" title="Something failed">
              Error tone uses assertive live region.
            </DpsNotificationBanner>
          </CardContent>
        </Card>
      </DpsPageSection>

      <DpsPageSection>
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Message cards</CardTitle>
            <CardDescription>Tones and read states — fixed labels for visual check.</CardDescription>
          </CardHeader>
          <CardContent className="dps-stack-y max-w-2xl">
            <DpsMessageCard
              tone="info"
              readState="unread"
              title="Unread example"
              body="Long text wraps within the card without overflowing horizontally on narrow viewports. "
              timestamp="9:41 AM"
            />
            <DpsMessageCard
              tone="success"
              readState="read"
              title="Success tone"
              body="Read state styling."
              timestamp="Yesterday"
            />
            <DpsMessageCard
              tone="warning"
              readState="highlighted"
              title="Highlighted"
              body="Use sparingly for emphasis."
              timestamp="Mon"
              onDismiss={() => {}}
            />
          </CardContent>
        </Card>
      </DpsPageSection>

      <DpsPageSection>
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Grouped feed</CardTitle>
            <CardDescription>Group labels are supplied by the parent — no date logic here.</CardDescription>
          </CardHeader>
          <CardContent className="max-w-2xl">
            <DpsMessageGroup label="Today">
              <div role="list" className="dps-stack-y">
                <DpsMessageCard
                  asListItem
                  tone="system"
                  title="Sample row A"
                  body="Body text."
                  timestamp="8:00 AM"
                />
                <DpsMessageCard
                  asListItem
                  tone="info"
                  title="Sample row B"
                  body="Another row."
                  timestamp="10:15 AM"
                  primaryAction={{ label: 'Primary', onClick: () => {} }}
                  secondaryAction={{ label: 'Secondary', onClick: () => {} }}
                />
              </div>
            </DpsMessageGroup>
          </CardContent>
        </Card>
      </DpsPageSection>

      <DpsPageSection>
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Message list states</CardTitle>
            <CardDescription>Toggle async shell — no network.</CardDescription>
          </CardHeader>
          <CardContent className="dps-stack-y max-w-2xl">
            <div className="flex flex-wrap gap-3">
              {(['populated', 'loading', 'error', 'empty'] as const).map((key) => (
                <div key={key} className="flex items-center gap-2">
                  <input
                    type="radio"
                    id={`dps5-list-${key}`}
                    name="dps5-list-demo"
                    checked={listDemo === key}
                    onChange={() => setListDemo(key)}
                    className="dps-focus-ring rounded"
                  />
                  <Label htmlFor={`dps5-list-${key}`} className="cursor-pointer capitalize">
                    {key}
                  </Label>
                </div>
              ))}
            </div>
            <DpsMessageList
              isLoading={listDemo === 'loading'}
              error={listDemo === 'error' ? 'Sample error message' : null}
              onRetry={() => setListDemo('populated')}
              empty={listDemo === 'empty'}
              emptyTitle="No messages"
              emptyDescription="Empty state copy."
            >
              <DpsMessageCard tone="info" title="Populated" body="List body when loaded." timestamp="Now" />
            </DpsMessageList>
          </CardContent>
        </Card>
      </DpsPageSection>

      <DpsPageSection>
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Toasts</CardTitle>
            <CardDescription>Uses global `Toaster` — same queue as feature pages.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button type="button" onClick={showToastSuccess}>
              Success
            </Button>
            <Button type="button" variant="outline" onClick={showToastWarning}>
              Warning
            </Button>
            <Button type="button" variant="secondary" onClick={showToastInfo}>
              Info
            </Button>
          </CardContent>
        </Card>
      </DpsPageSection>
    </div>
  )
}
