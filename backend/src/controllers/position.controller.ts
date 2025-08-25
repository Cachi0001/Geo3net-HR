import { Request, Response } from 'express'
import { supabase } from '../config/database'
import { ResponseHandler } from '../utils/response'
import { AuthenticatedRequest } from '../middleware/permission'

export class PositionController {
  /**
   * Get all positions
   */
  async getPositions(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { data: positions, error } = await supabase
        .from('positions')
        .select(`
          id,
          title,
          description,
          department_id,
          salary_min,
          salary_max,
          level,
          created_at,
          updated_at,
          department:departments(id, name)
        `)
        .order('title')

      if (error) {
        console.error('Failed to fetch positions:', error)
        return ResponseHandler.internalError(res, 'Failed to fetch positions')
      }

      return ResponseHandler.success(res, 'Positions retrieved successfully', positions)
    } catch (error) {
      console.error('Error fetching positions:', error)
      return ResponseHandler.internalError(res, 'Failed to fetch positions')
    }
  }
}

export const positionController = new PositionController()