// Main Leave Management Service
// This service consolidates all leave management functionality

import { LeaveTypeService } from './leaveType.service'
import { LeavePolicyService } from './leavePolicy.service'
import { EmployeeLeavePolicyService } from './employeeLeavePolicy.service'
import { LeaveBalanceService } from './leaveBalance.service'
import { LeaveAccrualService } from './leaveAccrual.service'
import { EmployeeOnboardingService } from './employeeOnboarding.service'
import { LeaveRequestService } from './leaveRequest.service'
import { LeaveValidationService } from './leaveValidation.service'
import { LeaveWorkflowService } from './leaveWorkflow.service'

// Re-export all types for convenience
export * from '../types/leave.types'
export * from './employeeLeavePolicy.service'
export * from './employeeOnboarding.service'

// Re-export service classes
export { LeaveTypeService } from './leaveType.service'
export { LeavePolicyService } from './leavePolicy.service'
export { EmployeeLeavePolicyService } from './employeeLeavePolicy.service'
export { LeaveBalanceService } from './leaveBalance.service'
export { LeaveAccrualService } from './leaveAccrual.service'
export { EmployeeOnboardingService } from './employeeOnboarding.service'
export { LeaveRequestService } from './leaveRequest.service'
export { LeaveValidationService } from './leaveValidation.service'
export { LeaveWorkflowService } from './leaveWorkflow.service'

export class LeaveService {
  public leaveTypeService: LeaveTypeService
  public leavePolicyService: LeavePolicyService
  public employeeLeavePolicyService: EmployeeLeavePolicyService
  public leaveBalanceService: LeaveBalanceService
  public leaveAccrualService: LeaveAccrualService
  public employeeOnboardingService: EmployeeOnboardingService
  public leaveRequestService: LeaveRequestService
  public leaveValidationService: LeaveValidationService
  public leaveWorkflowService: LeaveWorkflowService

  constructor() {
    this.leaveTypeService = new LeaveTypeService()
    this.leavePolicyService = new LeavePolicyService()
    this.employeeLeavePolicyService = new EmployeeLeavePolicyService()
    this.leaveBalanceService = new LeaveBalanceService()
    this.leaveAccrualService = new LeaveAccrualService()
    this.employeeOnboardingService = new EmployeeOnboardingService()
    this.leaveRequestService = new LeaveRequestService()
    this.leaveValidationService = new LeaveValidationService()
    this.leaveWorkflowService = new LeaveWorkflowService()
  }

  // Convenience methods that delegate to appropriate services

  // Leave Types
  async createLeaveType(data: any, createdBy: string) {
    return this.leaveTypeService.createLeaveType(data, createdBy)
  }

  async getLeaveTypes(includeInactive = false) {
    return this.leaveTypeService.getAllLeaveTypes(includeInactive)
  }

  async getLeaveTypeById(id: string) {
    return this.leaveTypeService.getLeaveTypeById(id)
  }

  async updateLeaveType(id: string, data: any, updatedBy: string) {
    return this.leaveTypeService.updateLeaveType(id, data, updatedBy)
  }

  // Leave Policies
  async createLeavePolicy(data: any, createdBy: string) {
    return this.leavePolicyService.createLeavePolicy(data, createdBy)
  }

  async getLeavePolicies(includeInactive = false) {
    return this.leavePolicyService.getAllLeavePolicies(includeInactive)
  }

  async getLeavePolicyById(id: string) {
    return this.leavePolicyService.getLeavePolicyById(id)
  }

  async updateLeavePolicy(id: string, data: any, updatedBy: string) {
    return this.leavePolicyService.updateLeavePolicy(id, data, updatedBy)
  }

  // Employee Policy Assignments
  async assignPolicyToEmployee(data: any, assignedBy: string) {
    return this.employeeLeavePolicyService.assignPolicyToEmployee(data, assignedBy)
  }

  async getEmployeePolicyAssignments(employeeId: string, includeInactive = false) {
    return this.employeeLeavePolicyService.getEmployeePolicyAssignments(employeeId, includeInactive)
  }

  // Leave Balances
  async getEmployeeBalances(employeeId: string, year?: number) {
    return this.leaveBalanceService.getEmployeeBalances(employeeId, year)
  }

  async getBalanceHistory(employeeId: string, leaveTypeId: string, year?: number) {
    return this.leaveBalanceService.getBalanceHistory(employeeId, leaveTypeId, year)
  }

  // Accrual Processing
  async processScheduledAccruals() {
    return this.leaveAccrualService.processScheduledAccruals()
  }

  async processEmployeeAccruals(employeeId: string, processDate?: Date) {
    return this.leaveAccrualService.processEmployeeAccruals(employeeId, processDate)
  }

  // Employee Onboarding
  async onboardNewEmployee(data: any, onboardedBy: string) {
    return this.employeeOnboardingService.onboardNewEmployee(data, onboardedBy)
  }

  async adjustEmployeeBalance(employeeId: string, leaveTypeId: string, amount: number, reason: string, adjustedBy: string) {
    return this.employeeOnboardingService.adjustEmployeeBalance(employeeId, leaveTypeId, amount, reason, adjustedBy)
  }

  // Leave Requests
  async createLeaveRequest(data: any, employeeId: string) {
    return this.leaveRequestService.createLeaveRequest(data, employeeId)
  }

  async getLeaveRequestById(id: string) {
    return this.leaveRequestService.getLeaveRequestById(id)
  }

  async updateLeaveRequest(id: string, data: any, updatedBy: string) {
    return this.leaveRequestService.updateLeaveRequest(id, data, updatedBy)
  }

  async getEmployeeLeaveRequests(employeeId: string, filters: any = {}) {
    return this.leaveRequestService.getEmployeeLeaveRequests(employeeId, filters)
  }

  async getTeamLeaveRequests(managerId: string, filters: any = {}) {
    return this.leaveRequestService.getTeamLeaveRequests(managerId, filters)
  }

  // Leave Workflow
  async approveLeaveRequest(id: string, approvedBy: string, comments?: string) {
    return this.leaveWorkflowService.processWorkflowAction(id, {
      action: 'approve',
      performedBy: approvedBy,
      comments
    })
  }

  async denyLeaveRequest(id: string, deniedBy: string, reason: string) {
    return this.leaveWorkflowService.processWorkflowAction(id, {
      action: 'deny',
      performedBy: deniedBy,
      reason
    })
  }

  async cancelLeaveRequest(id: string, cancelledBy: string, reason?: string) {
    return this.leaveWorkflowService.processWorkflowAction(id, {
      action: 'cancel',
      performedBy: cancelledBy,
      reason
    })
  }

  // Leave Validation
  async validateLeaveRequest(employeeId: string, leaveTypeId: string, startDate: Date, endDate: Date) {
    return this.leaveValidationService.validateLeaveRequest(employeeId, leaveTypeId, startDate, endDate)
  }
}