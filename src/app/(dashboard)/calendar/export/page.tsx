'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Download, Link2, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function CalendarExportPage() {
  const [start, setStart] = useState(() => new Date().toISOString().slice(0, 10))
  const [end, setEnd] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 1)
    return d.toISOString().slice(0, 10)
  })
  const [downloading, setDownloading] = useState(false)
  const [feedUrl, setFeedUrl] = useState<string | null>(null)
  const [feedLoading, setFeedLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleDownload() {
    setDownloading(true)
    try {
      const res = await fetch(
        `/api/scheduling/export/ics?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
      )
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'workouts.ics'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // ignore
    } finally {
      setDownloading(false)
    }
  }

  async function handleGenerateFeed() {
    setFeedLoading(true)
    setFeedUrl(null)
    try {
      const res = await fetch('/api/scheduling/feed', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.feedUrl) {
        setFeedUrl(data.feedUrl)
      }
    } finally {
      setFeedLoading(false)
    }
  }

  function copyFeedUrl() {
    if (!feedUrl) return
    navigator.clipboard.writeText(feedUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="container max-w-lg py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Export calendar</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Download ICS or subscribe from Apple Calendar / Google Calendar.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Download ICS
          </CardTitle>
          <CardDescription>
            Export scheduled workouts for a date range as an .ics file. Open it in any calendar app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start">Start date</Label>
              <Input
                id="start"
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">End date</Label>
              <Input
                id="end"
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleDownload} disabled={downloading}>
            {downloading ? 'Downloading…' : 'Download workouts.ics'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Subscribe URL
          </CardTitle>
          <CardDescription>
            Use this URL in Apple Calendar (File → New Calendar Subscription) or Google Calendar
            (Add by URL) to subscribe. Your scheduled workouts will appear and update when the
            calendar app refreshes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleGenerateFeed} disabled={feedLoading} variant="outline">
            {feedLoading ? 'Generating…' : 'Generate feed URL'}
          </Button>
          {feedUrl && (
            <div className="flex gap-2">
              <Input readOnly value={feedUrl} className="font-mono text-sm" />
              <Button
                variant="outline"
                size="icon"
                onClick={copyFeedUrl}
                title="Copy"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Button variant="ghost" asChild>
        <Link href="/calendar">Back to calendar</Link>
      </Button>
    </div>
  )
}
