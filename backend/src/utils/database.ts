import { supabase } from '../config/database'

export class DatabaseHealthChecker {
  /**
   * Check if database connection is healthy
   */
  static async checkConnection(): Promise<{ healthy: boolean; message: string; details?: any }> {
    try {
      console.log('🔍 [DatabaseHealth] Checking database connection...')
      
      // Simple query to test connection
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .limit(1)
      
      if (error) {
        console.error('❌ [DatabaseHealth] Database connection failed:', error)
        return {
          healthy: false,
          message: 'Database connection failed',
          details: {
            error: error.message,
            code: error.code,
            hint: error.hint
          }
        }
      }
      
      console.log('✅ [DatabaseHealth] Database connection healthy')
      return {
        healthy: true,
        message: 'Database connection healthy'
      }
    } catch (error: any) {
      console.error('❌ [DatabaseHealth] Database health check failed:', error)
      return {
        healthy: false,
        message: 'Database health check failed',
        details: {
          error: error.message,
          stack: error.stack
        }
      }
    }
  }

  /**
   * Check if required tables exist
   */
  static async checkRequiredTables(): Promise<{ healthy: boolean; message: string; details?: any }> {
    const requiredTables = [
      'users',
      'user_roles',
      'roles',
      'password_reset_tokens',
      'email_verification_tokens'
    ]

    const results: any = {}
    let allTablesExist = true

    try {
      console.log('🔍 [DatabaseHealth] Checking required tables...')
      
      for (const table of requiredTables) {
        try {
          const { error } = await supabase
            .from(table)
            .select('*')
            .limit(1)
          
          if (error && error.code === '42P01') {
            // Table does not exist
            results[table] = { exists: false, error: 'Table does not exist' }
            allTablesExist = false
          } else if (error) {
            // Other error
            results[table] = { exists: false, error: error.message }
            allTablesExist = false
          } else {
            results[table] = { exists: true }
          }
        } catch (tableError: any) {
          results[table] = { exists: false, error: tableError.message }
          allTablesExist = false
        }
      }

      if (allTablesExist) {
        console.log('✅ [DatabaseHealth] All required tables exist')
        return {
          healthy: true,
          message: 'All required tables exist',
          details: results
        }
      } else {
        console.error('❌ [DatabaseHealth] Some required tables are missing')
        return {
          healthy: false,
          message: 'Some required tables are missing',
          details: results
        }
      }
    } catch (error: any) {
      console.error('❌ [DatabaseHealth] Table check failed:', error)
      return {
        healthy: false,
        message: 'Table check failed',
        details: {
          error: error.message,
          results
        }
      }
    }
  }

  /**
   * Comprehensive database health check
   */
  static async performHealthCheck(): Promise<{ 
    healthy: boolean; 
    message: string; 
    checks: { 
      connection: any; 
      tables: any; 
    } 
  }> {
    console.log('🔍 [DatabaseHealth] Performing comprehensive health check...')
    
    const connectionCheck = await this.checkConnection()
    const tablesCheck = await this.checkRequiredTables()
    
    const overallHealthy = connectionCheck.healthy && tablesCheck.healthy
    
    const result = {
      healthy: overallHealthy,
      message: overallHealthy 
        ? 'Database is healthy' 
        : 'Database has issues',
      checks: {
        connection: connectionCheck,
        tables: tablesCheck
      }
    }
    
    if (overallHealthy) {
      console.log('✅ [DatabaseHealth] Database is fully healthy')
    } else {
      console.error('❌ [DatabaseHealth] Database has health issues')
    }
    
    return result
  }
}

/**
 * Enhanced error handler for database operations
 */
export class DatabaseErrorHandler {
  /**
   * Handle and categorize database errors
   */
  static handleError(error: any): {
    type: string;
    message: string;
    userMessage: string;
    shouldRetry: boolean;
    details?: any;
  } {
    if (!error) {
      return {
        type: 'unknown',
        message: 'Unknown database error',
        userMessage: 'An unexpected error occurred',
        shouldRetry: false
      }
    }

    // PostgreSQL error codes
    switch (error.code) {
      case '23505': // Unique constraint violation
        return {
          type: 'constraint_violation',
          message: 'Unique constraint violation',
          userMessage: 'This record already exists',
          shouldRetry: false,
          details: {
            constraint: error.constraint,
            detail: error.detail
          }
        }

      case '23503': // Foreign key constraint violation
        return {
          type: 'foreign_key_violation',
          message: 'Foreign key constraint violation',
          userMessage: 'Referenced record does not exist',
          shouldRetry: false,
          details: {
            constraint: error.constraint,
            detail: error.detail
          }
        }

      case '23514': // Check constraint violation
        return {
          type: 'check_constraint_violation',
          message: 'Check constraint violation',
          userMessage: 'Invalid data provided',
          shouldRetry: false,
          details: {
            constraint: error.constraint,
            detail: error.detail
          }
        }

      case '23502': // Not null constraint violation
        return {
          type: 'not_null_violation',
          message: 'Required field is missing',
          userMessage: 'Required information is missing',
          shouldRetry: false,
          details: {
            column: error.column,
            detail: error.detail
          }
        }

      case '42P01': // Table does not exist
        return {
          type: 'table_not_found',
          message: 'Table does not exist',
          userMessage: 'System configuration error',
          shouldRetry: false,
          details: {
            table: error.table
          }
        }

      case '42703': // Column does not exist
        return {
          type: 'column_not_found',
          message: 'Column does not exist',
          userMessage: 'System configuration error',
          shouldRetry: false,
          details: {
            column: error.column
          }
        }

      case '08006': // Connection failure
      case '08001': // Unable to connect
        return {
          type: 'connection_error',
          message: 'Database connection failed',
          userMessage: 'Service temporarily unavailable',
          shouldRetry: true,
          details: {
            hint: 'Check database connectivity'
          }
        }

      case '53300': // Too many connections
        return {
          type: 'connection_limit',
          message: 'Too many database connections',
          userMessage: 'Service temporarily busy',
          shouldRetry: true,
          details: {
            hint: 'Try again in a few moments'
          }
        }

      case '57014': // Query cancelled
        return {
          type: 'query_cancelled',
          message: 'Query was cancelled',
          userMessage: 'Operation timed out',
          shouldRetry: true,
          details: {
            hint: 'Try again with simpler query'
          }
        }

      default:
        // Network or other errors
        if (error.message?.includes('fetch failed') || 
            error.message?.includes('Failed to fetch') ||
            error.message?.includes('network')) {
          return {
            type: 'network_error',
            message: 'Network connection failed',
            userMessage: 'Connection problem, please try again',
            shouldRetry: true,
            details: {
              originalMessage: error.message
            }
          }
        }

        return {
          type: 'unknown',
          message: error.message || 'Unknown database error',
          userMessage: 'An unexpected error occurred',
          shouldRetry: false,
          details: {
            code: error.code,
            hint: error.hint,
            detail: error.detail
          }
        }
    }
  }

  /**
   * Retry database operation with exponential backoff
   */
  static async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 [DatabaseRetry] Attempt ${attempt}/${maxRetries}`)
        return await operation()
      } catch (error: any) {
        lastError = error
        const errorInfo = this.handleError(error)
        
        console.error(`❌ [DatabaseRetry] Attempt ${attempt} failed:`, errorInfo.message)
        
        if (!errorInfo.shouldRetry || attempt === maxRetries) {
          console.error(`❌ [DatabaseRetry] Giving up after ${attempt} attempts`)
          throw error
        }
        
        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1)
        console.log(`⏳ [DatabaseRetry] Waiting ${delay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }
}