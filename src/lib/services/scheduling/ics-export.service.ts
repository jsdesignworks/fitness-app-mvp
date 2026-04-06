import { SchedulingService } from '@/lib/services/scheduling/scheduling.service'
import { CalendarFeedTokenRepository } from '@/lib/repositories/scheduling/calendar-feed-token.repository'
import { WorkoutRepository } from '@/lib/repositories/workout/workout.repository'
import type { ScheduledWorkout } from '@/lib/domain/scheduling.types'

const CRLF = '\r\n'

function icsEscape(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function formatDateUTC(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'
}

function formatDateTimeUTC(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '') + 'Z'
}

async function getEventSummary(sw: ScheduledWorkout): Promise<string> {
  if (sw.titleOverride?.trim()) return sw.titleOverride.trim()
  if (sw.workoutId) {
    const template = await WorkoutRepository.getById(sw.workoutId)
    if (template?.name) return template.name
  }
  return 'Workout'
}

export const IcsExportService = {
  async generateIcs(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<string> {
    const { scheduledWorkouts } = await SchedulingService.getSchedule(
      userId,
      startDate,
      endDate
    )
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Fitness App//Scheduled Workouts//EN',
      'CALSCALE:GREGORIAN',
    ]
    for (const sw of scheduledWorkouts) {
      const summary = await getEventSummary(sw)
      const start = sw.startAt
      const end = sw.endAt ?? new Date(start.getTime() + 60 * 60 * 1000)
      const uid = `${sw.id}@fitness-app`
      const desc = [sw.notes, `Status: ${sw.status}`].filter(Boolean).join('\\n')
      lines.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${formatDateTimeUTC(new Date())}`,
        `DTSTART:${formatDateTimeUTC(start)}`,
        `DTEND:${formatDateTimeUTC(end)}`,
        `SUMMARY:${icsEscape(summary)}`,
        ...(desc ? [`DESCRIPTION:${icsEscape(desc)}`] : []),
        'END:VEVENT'
      )
    }
    lines.push('END:VCALENDAR')
    return lines.join(CRLF)
  },

  async generateIcsFeed(token: string, daysAhead = 90): Promise<string> {
    const resolved = await CalendarFeedTokenRepository.getByToken(token)
    if (!resolved) throw new Error('Invalid or expired feed token')
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + daysAhead)
    return this.generateIcs(resolved.userId, start, end)
  },
}
