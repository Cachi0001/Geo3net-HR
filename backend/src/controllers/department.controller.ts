import { Request, Response } from 'express'
import { supabase } from '../config/database'
import { ResponseHandler } from '../utils/response'
import { AuthenticatedRequest } from '../middleware/auth'
import Joi from 'joi'
import { ValidationError } from '../utils/errors'

const createDepartmentSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional(),
  manager_id: Joi.alternatives().try(
    Joi.string().uuid(),
    Joi.allow(null)
  ).optional(),
  is_active: Joi.boolean().default(true)
})

const updateDepartmentSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(500).optional(),
  manager_id: Joi.alternatives().try(
    Joi.string().uuid(),
    Joi.allow(null)
  ).optional(),
  is_active: Joi.boolean().optional()
})

export class DepartmentController {
  async getDepartments(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { data: departments, error } = await supabase
        .from('departments')
        .select(`
          id,
          name,
          description,
          manager_id,
          is_active,
          created_at,
          updated_at,
          manager:users!manager_id(id, full_name, email)
        `)
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error('Error fetching departments:', error)
        return ResponseHandler.internalError(res, 'Failed to fetch departments')
      }

      return ResponseHandler.success(res, 'Departments retrieved successfully', departments || [])
    } catch (error) {
      console.error('Department fetch error:', error)
      return ResponseHandler.internalError(res, 'Failed to fetch departments')
    }
  }

  async getDepartment(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params

      const { data: department, error } = await supabase
        .from('departments')
        .select(`
          id,
          name,
          description,
          manager_id,
          is_active,
          created_at,
          updated_at,
          manager:users!manager_id(id, full_name, email)
        `)
        .eq('id', id)
        .single()

      if (error || !department) {
        return ResponseHandler.notFound(res, 'Department not found')
      }

      return ResponseHandler.success(res, 'Department retrieved successfully', department)
    } catch (error) {
      console.error('Department fetch error:', error)
      return ResponseHandler.internalError(res, 'Failed to fetch department')
    }
  }

  async createDepartment(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { error: validationError, value } = createDepartmentSchema.validate(req.body)
      if (validationError) {
        const errors = validationError.details.map(detail => detail.message)
        throw new ValidationError('Validation failed', errors)
      }

      const { name, description, manager_id, is_active } = value

      // Check if department name already exists
      const { data: existingDept } = await supabase
        .from('departments')
        .select('id')
        .eq('name', name)
        .eq('is_active', true)
        .single()

      if (existingDept) {
        return ResponseHandler.badRequest(res, 'Department with this name already exists')
      }

      const { data: department, error } = await supabase
        .from('departments')
        .insert({
          name,
          description,
          manager_id,
          is_active: is_active ?? true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          id,
          name,
          description,
          manager_id,
          is_active,
          created_at,
          updated_at,
          manager:users!manager_id(id, full_name, email)
        `)
        .single()

      if (error) {
        console.error('Error creating department:', error)
        return ResponseHandler.internalError(res, 'Failed to create department')
      }

      return ResponseHandler.created(res, 'Department created successfully', department)
    } catch (error) {
      if (error instanceof ValidationError) {
        return ResponseHandler.badRequest(res, error.message, error.errors)
      }
      console.error('Department creation error:', error)
      return ResponseHandler.internalError(res, 'Failed to create department')
    }
  }

  async updateDepartment(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const { error: validationError, value } = updateDepartmentSchema.validate(req.body)
      
      if (validationError) {
        const errors = validationError.details.map(detail => detail.message)
        throw new ValidationError('Validation failed', errors)
      }

      // Check if department exists
      const { data: existingDept } = await supabase
        .from('departments')
        .select('id, name')
        .eq('id', id)
        .single()

      if (!existingDept) {
        return ResponseHandler.notFound(res, 'Department not found')
      }

      // Check if new name conflicts with existing department
      if (value.name && value.name !== existingDept.name) {
        const { data: conflictDept } = await supabase
          .from('departments')
          .select('id')
          .eq('name', value.name)
          .eq('is_active', true)
          .neq('id', id)
          .single()

        if (conflictDept) {
          return ResponseHandler.badRequest(res, 'Department with this name already exists')
        }
      }

      const updateData = {
        ...value,
        updated_at: new Date().toISOString()
      }

      const { data: department, error } = await supabase
        .from('departments')
        .update(updateData)
        .eq('id', id)
        .select(`
          id,
          name,
          description,
          manager_id,
          is_active,
          created_at,
          updated_at,
          manager:users!manager_id(id, full_name, email)
        `)
        .single()

      if (error) {
        console.error('Error updating department:', error)
        return ResponseHandler.internalError(res, 'Failed to update department')
      }

      return ResponseHandler.success(res, 'Department updated successfully', department)
    } catch (error) {
      if (error instanceof ValidationError) {
        return ResponseHandler.badRequest(res, error.message, error.errors)
      }
      console.error('Department update error:', error)
      return ResponseHandler.internalError(res, 'Failed to update department')
    }
  }

  async deleteDepartment(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params

      // Check if department exists
      const { data: existingDept } = await supabase
        .from('departments')
        .select('id, name')
        .eq('id', id)
        .single()

      if (!existingDept) {
        return ResponseHandler.notFound(res, 'Department not found')
      }

      // Check if department has employees
      const { data: employees } = await supabase
        .from('users')
        .select('id')
        .eq('department_id', id)
        .limit(1)

      if (employees && employees.length > 0) {
        return ResponseHandler.badRequest(res, 'Cannot delete department with active employees')
      }

      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('departments')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        console.error('Error deleting department:', error)
        return ResponseHandler.internalError(res, 'Failed to delete department')
      }

      return ResponseHandler.success(res, 'Department deleted successfully')
    } catch (error) {
      console.error('Department deletion error:', error)
      return ResponseHandler.internalError(res, 'Failed to delete department')
    }
  }

  async getDepartmentEmployees(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params

      // Check if department exists
      const { data: department } = await supabase
        .from('departments')
        .select('id, name')
        .eq('id', id)
        .single()

      if (!department) {
        return ResponseHandler.notFound(res, 'Department not found')
      }

      const { data: employees, error } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          email,
          employee_id,
          position_id,
          hire_date,
          status,
          account_status
        `)
        .eq('department_id', id)
        .eq('status', 'active')
        .order('full_name')

      if (error) {
        console.error('Error fetching department employees:', error)
        return ResponseHandler.internalError(res, 'Failed to fetch department employees')
      }

      return ResponseHandler.success(res, 'Department employees retrieved successfully', {
        department,
        employees: employees || []
      })
    } catch (error) {
      console.error('Department employees fetch error:', error)
      return ResponseHandler.internalError(res, 'Failed to fetch department employees')
    }
  }
}