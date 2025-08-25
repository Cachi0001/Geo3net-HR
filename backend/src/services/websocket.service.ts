import { WebSocketServer, WebSocket } from 'ws'
import { Server } from 'http'
import jwt from 'jsonwebtoken'
import { supabase } from '../config/database'

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string
  userRole?: string
  isAlive?: boolean
}

interface TaskProgressUpdate {
  taskId: string
  status?: string
  actualHours?: number
  progressNotes?: string
  updatedBy: {
    id: string
    fullName: string
  }
  timestamp: string
}

interface NotificationMessage {
  type: 'task_progress' | 'task_assignment' | 'task_status_change' | 'notification' | 'attendance_update' | 'attendance_violation' | 'attendance_notification'
  data: any
  timestamp: string
  userId?: string
}

class WebSocketService {
  private wss: WebSocketServer | null = null
  private clients: Map<string, AuthenticatedWebSocket[]> = new Map()
  private heartbeatInterval: NodeJS.Timeout | null = null

  initialize(server: Server): void {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      verifyClient: (info: any) => {
        return true
      }
    })

    this.wss.on('connection', this.handleConnection.bind(this))
    this.startHeartbeat()
    
    console.log('🔌 WebSocket server initialized')
  }

  private async handleConnection(ws: AuthenticatedWebSocket, request: any): Promise<void> {
    console.log('🔗 New WebSocket connection attempt')
    
    // Extract token from query parameters or headers
    const url = new URL(request.url, `http://${request.headers.host}`)
    const token = url.searchParams.get('token') || request.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      console.log('❌ WebSocket connection rejected: No token provided')
      ws.close(1008, 'Authentication required')
      return
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
      
      // Get user details from database
      const { data: user, error } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('id', decoded.userId)
        .single()

      if (error || !user) {
        console.log('❌ WebSocket connection rejected: Invalid user')
        ws.close(1008, 'Invalid user')
        return
      }

      // Authenticate the WebSocket
      ws.userId = user.id
      ws.userRole = 'authenticated' // We'll get roles separately if needed
      ws.isAlive = true

      // Add to clients map
      if (!this.clients.has(user.id)) {
        this.clients.set(user.id, [])
      }
      this.clients.get(user.id)!.push(ws)

      console.log(`✅ WebSocket authenticated for user: ${user.full_name}`)

      // Send welcome message
      this.sendToClient(ws, {
        type: 'notification',
        data: {
          message: 'Connected to real-time updates',
          type: 'connection_success'
        },
        timestamp: new Date().toISOString()
      })

      // Handle messages from client
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString())
          this.handleClientMessage(ws, message)
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error)
        }
      })

      // Handle connection close
      ws.on('close', () => {
        this.removeClient(user.id, ws)
        console.log(`🔌 WebSocket disconnected for user: ${user.full_name}`)
      })

      // Handle pong responses for heartbeat
      ws.on('pong', () => {
        ws.isAlive = true
      })

    } catch (error) {
      console.log('❌ WebSocket authentication failed:', error)
      ws.close(1008, 'Authentication failed')
    }
  }

  private handleClientMessage(ws: AuthenticatedWebSocket, message: any): void {
    switch (message.type) {
      case 'ping':
        this.sendToClient(ws, {
          type: 'notification',
          data: { type: 'pong' },
          timestamp: new Date().toISOString()
        })
        break
      
      case 'subscribe_task':
        // Client wants to subscribe to specific task updates
        console.log(`📋 User ${ws.userId} subscribed to task ${message.taskId}`)
        break
        
      default:
        console.log('❓ Unknown WebSocket message type:', message.type)
    }
  }

  private removeClient(userId: string, ws: AuthenticatedWebSocket): void {
    const userClients = this.clients.get(userId)
    if (userClients) {
      const index = userClients.indexOf(ws)
      if (index > -1) {
        userClients.splice(index, 1)
      }
      if (userClients.length === 0) {
        this.clients.delete(userId)
      }
    }
  }

  private sendToClient(ws: AuthenticatedWebSocket, message: NotificationMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message))
      } catch (error) {
        console.error('❌ Error sending WebSocket message:', error)
      }
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((userClients, userId) => {
        userClients.forEach((ws, index) => {
          if (!ws.isAlive) {
            console.log(`💔 Terminating dead WebSocket connection for user: ${userId}`)
            ws.terminate()
            userClients.splice(index, 1)
            return
          }
          
          ws.isAlive = false
          ws.ping()
        })
        
        if (userClients.length === 0) {
          this.clients.delete(userId)
        }
      })
    }, 30000) // 30 seconds
  }

  // Public methods for sending notifications
  
  public broadcastTaskProgressUpdate(update: TaskProgressUpdate): void {
    const message: NotificationMessage = {
      type: 'task_progress',
      data: update,
      timestamp: new Date().toISOString()
    }

    // Send to all connected clients (managers and admins should see all updates)
    this.clients.forEach((userClients, userId) => {
      userClients.forEach(ws => {
        if (ws.userRole && ['super_admin', 'hr_admin', 'manager'].includes(ws.userRole)) {
          this.sendToClient(ws, message)
        }
      })
    })

    console.log(`📡 Broadcasted task progress update for task: ${update.taskId}`)
  }

  public sendTaskNotificationToUser(userId: string, notification: any): void {
    const userClients = this.clients.get(userId)
    if (userClients && userClients.length > 0) {
      const message: NotificationMessage = {
        type: 'notification',
        data: notification,
        timestamp: new Date().toISOString(),
        userId
      }

      userClients.forEach(ws => {
        this.sendToClient(ws, message)
      })

      console.log(`📬 Sent task notification to user: ${userId}`)
    }
  }

  public sendTaskStatusChangeNotification(taskId: string, oldStatus: string, newStatus: string, updatedBy: any): void {
    const message: NotificationMessage = {
      type: 'task_status_change',
      data: {
        taskId,
        oldStatus,
        newStatus,
        updatedBy,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    }

    // Broadcast to managers and admins
    this.clients.forEach((userClients, userId) => {
      userClients.forEach(ws => {
        if (ws.userRole && ['super_admin', 'hr_admin', 'manager'].includes(ws.userRole)) {
          this.sendToClient(ws, message)
        }
      })
    })

    console.log(`📊 Broadcasted task status change: ${taskId} (${oldStatus} → ${newStatus})`)
  }

  // Attendance-related WebSocket methods
  public broadcastAttendanceUpdate(employeeId: string, eventType: string, sessionData: any): void {
    const message: NotificationMessage = {
      type: 'attendance_update',
      data: {
        employeeId,
        eventType,
        sessionData,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    }

    // Send to managers and admins for real-time monitoring
    this.clients.forEach((userClients, userId) => {
      userClients.forEach(ws => {
        if (ws.userRole && ['super_admin', 'hr_admin', 'manager'].includes(ws.userRole)) {
          this.sendToClient(ws, message)
        }
      })
    })

    console.log(`📍 Broadcasted attendance update: ${employeeId} - ${eventType}`)
  }

  public sendAttendanceViolationAlert(violation: any): void {
    const message: NotificationMessage = {
      type: 'attendance_violation',
      data: {
        violation,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    }

    // Send to managers and HR for immediate attention
    this.clients.forEach((userClients, userId) => {
      userClients.forEach(ws => {
        if (ws.userRole && ['super_admin', 'hr_admin', 'manager'].includes(ws.userRole)) {
          this.sendToClient(ws, message)
        }
      })
    })

    console.log(`🚨 Sent attendance violation alert: ${violation.violationType}`)
  }

  public sendAttendanceNotificationToUser(userId: string, notification: any): void {
    const userClients = this.clients.get(userId)
    if (userClients && userClients.length > 0) {
      const message: NotificationMessage = {
        type: 'attendance_notification',
        data: notification,
        timestamp: new Date().toISOString(),
        userId
      }

      userClients.forEach(ws => {
        this.sendToClient(ws, message)
      })

      console.log(`📱 Sent attendance notification to user: ${userId}`)
    }
  }

  public getConnectedUsers(): string[] {
    return Array.from(this.clients.keys())
  }

  public getConnectionCount(): number {
    let count = 0
    this.clients.forEach(userClients => {
      count += userClients.length
    })
    return count
  }

  public shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }
    
    if (this.wss) {
      this.wss.close()
    }
    
    this.clients.clear()
    console.log('🔌 WebSocket service shutdown')
  }
}

export const websocketService = new WebSocketService()
export { WebSocketService, TaskProgressUpdate, NotificationMessage }