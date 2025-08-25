// Leave Management Type Definitions

export interface LeaveType {
  id: string
  name: string
  description?: string
  colorCode: string
  isPaid: boolean
  requiresApproval: boolean
  maxConsecutiveDays?: number
  advanceNoticeDays: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
}

export interface CreateLeaveTypeData {
  name: string
  description?: string
  colorCode?: string
  isPaid?: boolean
  requiresApproval?: boolean
  maxConsecutiveDays?: number
  advanceNoticeDays?: number
}

export interface UpdateLeaveTypeData {
  name?: string
  description?: string
  colorCode?: string
  isPaid?: boolean
  requiresApproval?: boolean
  maxConsecutiveDays?: number
  advanceNoticeDays?: number
  isActive?: boolean
}

export interface LeavePolicy {
  id: string
  name: string
  description?: string
  leaveTypeId: string
  annualAllocation: number
  accrualRate: number
  accrualFrequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually'
  maxBalance?: number
  carryoverLimit: number
  carryoverExpiryMonths: number
  probationPeriodMonths: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string

  // Populated fields
  leaveType?: LeaveType
}

export interface CreateLeavePolicyData {
  name: string
  description?: string
  leaveTypeId: string
  annualAllocation: number
  accrualRate?: number
  accrualFrequency?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually'
  maxBalance?: number
  carryoverLimit?: number
  carryoverExpiryMonths?: number
  probationPeriodMonths?: number
}

export interface UpdateLeavePolicyData {
  name?: string
  description?: string
  annualAllocation?: number
  accrualRate?: number
  accrualFrequency?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually'
  maxBalance?: number
  carryoverLimit?: number
  carryoverExpiryMonths?: number
  probationPeriodMonths?: number
  isActive?: boolean
}

export interface EmployeeLeavePolicy {
  id: string
  employeeId: string
  leavePolicyId: string
  effectiveDate: string
  expiryDate?: string
  customAllocation?: number
  isActive: boolean
  createdAt: string
  createdBy?: string

  // Populated fields
  leavePolicy?: LeavePolicy
}

export interface LeaveRequest {
  id: string
  employeeId: string
  leaveTypeId: string
  startDate: string
  endDate: string
  totalDays: number
  reason?: string
  status: 'pending' | 'approved' | 'denied' | 'cancelled' | 'withdrawn'
  approvedBy?: string
  approvedAt?: string
  denialReason?: string
  emergencyContactNotified: boolean
  attachments: string[]
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string

  // Populated fields
  employee?: any
  leaveType?: LeaveType
  approver?: any
}

export interface CreateLeaveRequestData {
  leaveTypeId: string
  startDate: string
  endDate: string
  reason?: string
  emergencyContactNotified?: boolean
  attachments?: string[]
}

export interface UpdateLeaveRequestData {
  startDate?: string
  endDate?: string
  reason?: string
  status?: 'pending' | 'approved' | 'denied' | 'cancelled' | 'withdrawn'
  denialReason?: string
  emergencyContactNotified?: boolean
  attachments?: string[]
}

export interface LeaveBalance {
  id: string
  employeeId: string
  leaveTypeId: string
  policyYear: number
  allocatedDays: number
  usedDays: number
  pendingDays: number
  carriedOverDays: number
  availableDays: number
  lastAccrualDate?: string
  createdAt: string
  updatedAt: string

  // Populated fields
  leaveType?: LeaveType
}

export interface LeaveAccrualHistory {
  id: string
  employeeId: string
  leaveTypeId: string
  accrualDate: string
  accruedDays: number
  balanceBefore: number
  balanceAfter: number
  accrualReason: string
  policyYear: number
  createdAt: string
}

export interface LeaveSearchFilters {
  employeeId?: string
  leaveTypeId?: string
  status?: string
  startDate?: string
  endDate?: string
  managerId?: string
  departmentId?: string
  limit?: number
  offset?: number
}

export interface LeaveTypeResult {
  success: boolean
  message: string
  leaveType?: LeaveType
  leaveTypes?: LeaveType[]
}

export interface LeavePolicyResult {
  success: boolean
  message: string
  leavePolicy?: LeavePolicy
  leavePolicies?: LeavePolicy[]
}

export interface LeaveRequestResult {
  success: boolean
  message: string
  leaveRequest?: LeaveRequest
  leaveRequests?: LeaveRequest[]
  total?: number
}

export interface LeaveBalanceResult {
  success: boolean
  message: string
  leaveBalance?: LeaveBalance
  leaveBalances?: LeaveBalance[]
}

export interface BalanceChange {
  type: 'accrual' | 'usage' | 'adjustment' | 'carryover'
  amount: number
  reason: string
  effectiveDate: string
}

export interface AccrualResult {
  success: boolean
  message: string
  processedEmployees: number
  totalAccrued: number
  errors: string[]
}

export interface CarryoverResult {
  success: boolean
  message: string
  processedEmployees: number
  totalCarriedOver: number
  totalExpired: number
  errors: string[]
}

export interface ConflictCheck {
  hasConflict: boolean
  conflictingRequests: LeaveRequest[]
  message?: string
}

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  employeeId: string
  employeeName: string
  leaveType: string
  status: string
  color: string
}

export interface CalendarFilters {
  startDate: string
  endDate: string
  employeeIds?: string[]
  departmentIds?: string[]
  leaveTypeIds?: string[]
  managerId?: string
}

export interface BalanceHistory {
  date: string
  type: 'accrual' | 'usage' | 'adjustment' | 'carryover'
  amount: number
  balance: number
  reason: string
}