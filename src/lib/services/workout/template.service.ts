import { WorkoutRepository, type WorkoutTemplateWithItems } from '@/lib/repositories/workout/workout.repository'
import { Result, ok, err } from '@/lib/domain/shared/types'
import type { WorkoutTemplateItem } from '@/lib/domain/workout.types'
import { AppError } from '@/lib/utils/errors'

export class TemplateService {
  static async createTemplate(
    userId: string,
    payload: {
      name: string
      notes?: string
      items: { exerciseId: string; orderIndex: number; plannedStructure?: WorkoutTemplateItem['plannedStructure'] }[]
    }
  ): Promise<Result<WorkoutTemplateWithItems>> {
    try {
      if (!payload.items?.length) {
        return err(new AppError('TEMPLATE_EMPTY', 'Add at least one exercise'))
      }
      const template = await WorkoutRepository.create({
        userId,
        name: payload.name,
        notes: payload.notes,
        items: payload.items,
      })
      return ok(template)
    } catch (error) {
      return err(new AppError('TEMPLATE_CREATE_FAILED', 'Failed to create template'))
    }
  }

  static async updateTemplate(
    userId: string,
    templateId: string,
    payload: {
      name?: string
      notes?: string
      items?: { exerciseId: string; orderIndex: number; plannedStructure?: WorkoutTemplateItem['plannedStructure'] }[]
    }
  ): Promise<Result<WorkoutTemplateWithItems>> {
    try {
      const existing = await WorkoutRepository.getById(templateId)
      if (!existing || existing.userId !== userId) {
        return err(new AppError('TEMPLATE_NOT_FOUND', 'Template not found'))
      }
      const template = await WorkoutRepository.update(templateId, payload)
      return ok(template)
    } catch (error) {
      return err(new AppError('TEMPLATE_UPDATE_FAILED', 'Failed to update template'))
    }
  }

  static async deleteTemplate(userId: string, templateId: string): Promise<Result<void>> {
    try {
      const existing = await WorkoutRepository.getById(templateId)
      if (!existing || existing.userId !== userId) {
        return err(new AppError('TEMPLATE_NOT_FOUND', 'Template not found'))
      }
      await WorkoutRepository.delete(templateId)
      return ok(undefined)
    } catch (error) {
      return err(new AppError('TEMPLATE_DELETE_FAILED', 'Failed to delete template'))
    }
  }
}
