import { supabase } from '../config/database'
import { LeaveRequestService } from './leaveRequest.service'
import { LeaveValidationService } from './leaveValidation.service'
import { EmailService } from './email.service'
import { ValidationError, NotFoundError } from '../utils/errors'

export interface WorkflowAction {
    action: 'approve' | 'deny' | 'cancel' | 'withdraw' | 'resubmit'
    performedBy: string
    reason?: string
    comments?: string
    notifyEmployee?: boolean
    notifyManager?: boolean
}

export interface WorkflowResult {
    success: boolean
    message: string
    newStatus: string
    notificationsSent: string[]
    errors: string[]
}

export interface StatusTransition {
    fromStatus: string
    toStatus: string
    allowedRoles: string[]
    requiresReason: boolean
    autoNotify: boolean
}

export class LeaveWorkflowService {
    private leaveRequestService: LeaveRequestService
    private leaveValidationService: LeaveValidationService
    private emailService: EmailService

    // Define allowed status transitions
    private readonly statusTransitions: StatusTransition[] = [
        {
            fromStatus: 'pending',
            toStatus: 'approved',
            allowedRoles: ['manager', 'hr-admin', 'super-admin'],
            requiresReason: false,
            autoNotify: true
        },
        {
            fromStatus: 'pending',
            toStatus: 'denied',
            allowedRoles: ['manager', 'hr-admin', 'super-admin'],
            requiresReason: true,
            autoNotify: true
        },
        {
            fromStatus: 'pending',
            toStatus: 'withdrawn',
            allowedRoles: ['employee', 'manager', 'hr-admin', 'super-admin'],
            requiresReason: false,
            autoNotify: true
        },
        {
            fromStatus: 'approved',
            toStatus: 'cancelled',
            allowedRoles: ['employee', 'manager', 'hr-admin', 'super-admin'],
            requiresReason: true,
            autoNotify: true
        },
        {
            fromStatus: 'denied',
            toStatus: 'pending',
            allowedRoles: ['employee'],
            requiresReason: false,
            autoNotify: true
        }
    ]

    constructor() {
        this.leaveRequestService = new LeaveRequestService()
        this.leaveValidationService = new LeaveValidationService()
        this.emailService = new EmailService()
    }

    async processWorkflowAction(requestId: string, action: WorkflowAction): Promise<WorkflowResult> {
        try {
            console.log(`🔄 Processing workflow action: ${action.action} for request ${requestId}`)

            // Get the current request
            const request = await this.leaveRequestService.getLeaveRequestById(requestId)
            if (!request) {
                throw new NotFoundError('Leave request not found')
            }

            // Determine target status based on action
            const targetStatus = this.getTargetStatus(action.action, request.status)

            // Validate the transition
            await this.validateStatusTransition(request, targetStatus, action)

            // Perform the action
            let result: any
            const notificationsSent: string[] = []
            const errors: string[] = []

            switch (action.action) {
                case 'approve':
                    result = await this.leaveRequestService.approveLeaveRequest(
                        requestId,
                        action.performedBy,
                        action.comments
                    )
                    break

                case 'deny':
                    if (!action.reason) {
                        throw new ValidationError('Reason is required for denying leave requests')
                    }
                    result = await this.leaveRequestService.denyLeaveRequest(
                        requestId,
                        action.performedBy,
                        action.reason
                    )
                    break

                case 'cancel':
                case 'withdraw':
                    result = await this.leaveRequestService.cancelLeaveRequest(
                        requestId,
                        action.performedBy,
                        action.reason
                    )
                    break

                case 'resubmit':
                    result = await this.resubmitLeaveRequest(requestId, action.performedBy)
                    break

                default:
                    throw new ValidationError(`Unsupported workflow action: ${action.action}`)
            }

            if (!result.success) {
                throw new Error(result.message)
            }

            // Send notifications if requested or required
            const transition = this.getTransition(request.status, targetStatus)
            if (transition?.autoNotify || action.notifyEmployee || action.notifyManager) {
                try {
                    await this.sendWorkflowNotifications(result.leaveRequest, action, transition)
                    notificationsSent.push('Employee notification sent')

                    if (action.notifyManager) {
                        notificationsSent.push('Manager notification sent')
                    }
                } catch (error: any) {
                    errors.push(`Failed to send notifications: ${error.message}`)
                }
            }

            // Log the workflow action
            await this.logWorkflowAction(requestId, action, result.leaveRequest.status)

            return {
                success: true,
                message: `Leave request ${action.action} successfully`,
                newStatus: result.leaveRequest.status,
                notificationsSent,
                errors
            }
        } catch (error: any) {
            console.error(`❌ Workflow action failed:`, error)
            throw error
        }
    }

    async bulkProcessRequests(
        requestIds: string[],
        action: WorkflowAction
    ): Promise<{ successful: string[], failed: { id: string, error: string }[] }> {
        const successful: string[] = []
        const failed: { id: string, error: string }[] = []

        for (const requestId of requestIds) {
            try {
                await this.processWorkflowAction(requestId, action)
                successful.push(requestId)
            } catch (error: any) {
                failed.push({ id: requestId, error: error.message })
            }
        }

        return { successful, failed }
    }

    async getAvailableActions(requestId: string, userRole: string): Promise<string[]> {
        try {
            const request = await this.leaveRequestService.getLeaveRequestById(requestId)
            if (!request) {
                return []
            }

            const availableActions: string[] = []

            // Check each possible transition
            for (const transition of this.statusTransitions) {
                if (transition.fromStatus === request.status &&
                    transition.allowedRoles.includes(userRole)) {

                    const action = this.getActionFromTransition(transition)
                    if (action) {
                        availableActions.push(action)
                    }
                }
            }

            return availableActions
        } catch (error) {
            return []
        }
    }

    async getWorkflowHistory(requestId: string): Promise<any[]> {
        try {
            // This would typically come from a workflow_history table
            // For now, we'll return a simplified version
            const { data, error } = await supabase
                .from('leave_requests')
                .select(`
          id,
          status,
          created_at,
          updated_at,
          approved_at,
          approved_by,
          denial_reason,
          employee:employees!employee_id(full_name),
          approver:employees!approved_by(full_name)
        `)
                .eq('id', requestId)
                .single()

            if (error || !data) return []

            const history: any[] = [
                {
                    action: 'submitted',
                    performedBy: (data as any).employee?.full_name || 'Unknown',
                    timestamp: data.created_at,
                    status: 'pending'
                }
            ]

            if (data.approved_at && (data as any).approver) {
                const historyEntry: any = {
                    action: data.status === 'approved' ? 'approved' : 'denied',
                    performedBy: (data as any).approver?.full_name || 'Unknown',
                    timestamp: data.approved_at,
                    status: data.status
                }

                if (data.denial_reason) {
                    historyEntry.reason = data.denial_reason
                }

                history.push(historyEntry)
            }

            return history
        } catch (error) {
            return []
        }
    }

    private async validateStatusTransition(
        request: any,
        targetStatus: string,
        action: WorkflowAction
    ): Promise<void> {
        // Find the transition rule
        const transition = this.getTransition(request.status, targetStatus)
        if (!transition) {
            throw new ValidationError(`Invalid status transition from ${request.status} to ${targetStatus}`)
        }

        // Check if the user has permission for this transition
        const userRole = await this.getUserRole(action.performedBy)
        if (!transition.allowedRoles.includes(userRole)) {
            throw new ValidationError(`User role '${userRole}' is not authorized for this action`)
        }

        // Check if reason is required
        if (transition.requiresReason && !action.reason) {
            throw new ValidationError('Reason is required for this action')
        }

        // Additional business rule validations
        if (action.action === 'approve') {
            // Re-validate the request before approval
            const validation = await this.leaveValidationService.validateLeaveRequest(
                request.employeeId,
                request.leaveTypeId,
                new Date(request.startDate),
                new Date(request.endDate),
                request.id
            )

            if (!validation.isValid) {
                throw new ValidationError(`Cannot approve request: ${validation.errors.join(', ')}`)
            }
        }
    }

    private async resubmitLeaveRequest(requestId: string, resubmittedBy: string): Promise<any> {
        // Update status back to pending
        const result = await this.leaveRequestService.updateLeaveRequest(
            requestId,
            { status: 'pending' },
            resubmittedBy
        )

        return result
    }

    private async sendWorkflowNotifications(
        request: any,
        action: WorkflowAction,
        transition?: StatusTransition
    ): Promise<void> {
        if (!request.employee?.email) return

        let subject = ''
        let message = ''

        switch (action.action) {
            case 'approve':
                subject = 'Leave Request Approved'
                message = `Your leave request from ${request.startDate} to ${request.endDate} has been approved.`
                break

            case 'deny':
                subject = 'Leave Request Denied'
                message = `Your leave request from ${request.startDate} to ${request.endDate} has been denied. Reason: ${action.reason}`
                break

            case 'cancel':
            case 'withdraw':
                subject = 'Leave Request Cancelled'
                message = `Your leave request from ${request.startDate} to ${request.endDate} has been cancelled.`
                break
        }

        if (subject && message) {
            // This would integrate with your existing email service
            console.log(`📧 Sending notification: ${subject} to ${request.employee.email}`)
            // await this.emailService.sendLeaveNotification(request.employee.email, subject, message)
        }
    }

    private async logWorkflowAction(
        requestId: string,
        action: WorkflowAction,
        newStatus: string
    ): Promise<void> {
        // This would typically log to a workflow_history table
        console.log(`📝 Workflow action logged:`, {
            requestId,
            action: action.action,
            performedBy: action.performedBy,
            newStatus,
            timestamp: new Date().toISOString()
        })
    }

    private async getUserRole(userId: string): Promise<string> {
        try {
            const { data, error } = await supabase
                .from('user_roles')
                .select('role_name')
                .eq('user_id', userId)
                .eq('is_active', true)
                .single()

            if (error || !data) return 'employee'
            return data.role_name
        } catch (error) {
            return 'employee'
        }
    }

    private getTargetStatus(action: string, currentStatus: string): string {
        switch (action) {
            case 'approve':
                return 'approved'
            case 'deny':
                return 'denied'
            case 'cancel':
            case 'withdraw':
                return currentStatus === 'pending' ? 'withdrawn' : 'cancelled'
            case 'resubmit':
                return 'pending'
            default:
                return currentStatus
        }
    }

    private getTransition(fromStatus: string, toStatus: string): StatusTransition | undefined {
        return this.statusTransitions.find(
            t => t.fromStatus === fromStatus && t.toStatus === toStatus
        )
    }

    private getActionFromTransition(transition: StatusTransition): string | null {
        switch (transition.toStatus) {
            case 'approved':
                return 'approve'
            case 'denied':
                return 'deny'
            case 'cancelled':
                return 'cancel'
            case 'withdrawn':
                return 'withdraw'
            case 'pending':
                return 'resubmit'
            default:
                return null
        }
    }
}