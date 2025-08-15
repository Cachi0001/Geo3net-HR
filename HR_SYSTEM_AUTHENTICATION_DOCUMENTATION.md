# HR Management System - Authentication & Functionality Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Authentication Architecture](#authentication-architecture)
3. [Registration Flow](#registration-flow)
4. [Login Flow](#login-flow)
5. [Role-Based Access Control](#role-based-access-control)
6. [Dashboard Functionality](#dashboard-functionality)
7. [Core Features](#core-features)
8. [Security Features](#security-features)
9. [Database Schema](#database-schema)
10. [API Endpoints](#api-endpoints)

## System Overview

The HR Management System is a full-stack web application built with:
- **Frontend**: React with TypeScript
- **Backend**: Node.js with Express and TypeScript
- **Database**: PostgreSQL with Supabase
- **Authentication**: JWT tokens with role-based access control
- **Email Service**: Supabase Edge Functions

## Authentication Architecture

### Core Components

#### Backend Components
1. **AuthService** (`backend/src/services/auth.service.ts`)
   - Handles user registration, login, password management
   - Manages email verification and password reset flows
   - Integrates with RoleService for role assignment

2. **AuthController** (`backend/src/controllers/auth.controller.ts`)
   - REST API endpoints for authentication
   - Input validation using Joi schemas
   - Error handling and response formatting

3. **JWT Utils** (`backend/src/utils/jwt.ts`)
   - Token generation and verification
   - Access and refresh token management
   - Token payload structure

4. **Auth Middleware** (`backend/src/middleware/auth.ts`)
   - Token verification middleware
   - Role-based route protection
   - Optional authentication for public routes

#### Frontend Components
1. **AuthContext** (`frontend/src/contexts/AuthContext.tsx`)
   - Global authentication state management
   - User session persistence
   - Authentication methods (login, register, logout)

2. **AuthService** (`frontend/src/services/auth.service.ts`)
   - API communication for authentication
   - Token management
   - User profile operations

3. **ProtectedRoute** (`frontend/src/components/auth/ProtectedRoute/ProtectedRoute.tsx`)
   - Route-level access control
   - Role and permission validation
   - Automatic redirects for unauthorized access

## Registration Flow

### 1. User Registration Process

#### Frontend Registration (`RegisterForm.tsx`)
```typescript
interface FormData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
}
```

**Validation Rules:**
- First/Last name: minimum 2 characters
- Email: valid email format
- Password: minimum 8 characters with uppercase, lowercase, and number
- Password confirmation must match

#### Backend Registration Process
1. **Input Validation** (Joi schema)
2. **Password Strength Check**
3. **Duplicate Email Check**
4. **CEO Detection** (special handling for CEO email)
5. **User Creation** with appropriate status
6. **Role Assignment** (super-admin for CEO, employee for others)
7. **Email Verification** (for non-CEO users)

### 2. CEO vs Regular User Registration

#### CEO Registration
- Email matches `CEO_EMAIL` environment variable (default: `ceo@go3net.com`)
- Automatic `super-admin` role assignment
- `account_status: 'active'` and `status: 'active'`
- Employee ID: `CEO001`
- No email verification required
- Immediate login capability

#### Regular User Registration
- `employee` role assignment
- `account_status: 'pending_setup'` and `status: 'inactive'`
- Employee ID: `EMP{timestamp}`
- Email verification required
- Cannot login until email verified

### 3. Email Verification System
- Verification tokens stored in `email_verification_tokens` table
- 24-hour token expiration
- Supabase Edge Function handles verification
- Automatic account activation upon verification

## Login Flow

### 1. Standard Email/Password Login

#### Frontend Login Process
1. Form validation (email format, password length)
2. API call to `/auth/login`
3. Token storage in localStorage
4. User state update in AuthContext
5. Redirect to dashboard or intended route

#### Backend Login Process
1. **Input Validation**
2. **User Lookup** (active users only)
3. **Password Verification** (bcrypt comparison)
4. **Email Verification Check** (currently disabled)
5. **Role Retrieval** (active role only)
6. **JWT Token Generation** (access + refresh tokens)
7. **Response with user data and tokens**

### 2. Google OAuth Integration
- Google One Tap integration
- Automatic registration for new Google users
- Fallback to login for existing users
- Special password handling for OAuth users

### 3. Token Management
```typescript
interface AuthTokens {
  accessToken: string    // 24h expiration (default)
  refreshToken: string   // 7d expiration (default)
  expiresIn: string
}
```

## Role-Based Access Control

### Role Hierarchy
```typescript
const roleHierarchy = {
  'super-admin': { level: 5, permissions: ['*'] },
  'hr-admin': { level: 4, permissions: [...] },
  'manager': { level: 3, permissions: [...] },
  'hr-staff': { level: 2, permissions: [...] },
  'employee': { level: 1, permissions: [...] }
}
```

### Permission System
- **Resource-based permissions**: `employee.create`, `tasks.read`, etc.
- **Wildcard permissions**: `*` for super-admin
- **Hierarchical access**: Higher roles can assign lower roles
- **Scope-based access**: `own`, `team`, `all` scopes

### Route Protection
```typescript
// Example protected route usage
<ProtectedRoute requiredRole="hr-admin">
  <EmployeeManagement />
</ProtectedRoute>

<ProtectedRoute requiredPermissions={['employee.create']}>
  <CreateEmployee />
</ProtectedRoute>
```

## Dashboard Functionality

### Role-Based Dashboards

#### Super Admin Dashboard
- **Company Statistics Widget**: Employee counts, department stats
- **Recent Hires Widget**: Latest employee additions
- **Admin Actions Widget**: Quick access to admin functions
- **System Status Widget**: System health and metrics

#### Employee Dashboard
- Personal task list
- Time tracking interface
- Profile management
- Attendance history

#### Manager Dashboard
- Team overview
- Task assignment interface
- Performance metrics
- Approval workflows

### Dashboard Components
1. **Widgets**: Modular dashboard components
2. **Real-time Updates**: Live data refresh
3. **Responsive Design**: Mobile-friendly interface
4. **Role-based Content**: Dynamic content based on user role

## Core Features

### 1. Employee Management
- **CRUD Operations**: Create, read, update, delete employees
- **Department Assignment**: Link employees to departments
- **Position Management**: Job titles and descriptions
- **Manager Relationships**: Hierarchical reporting structure

### 2. Task Management
- **Task Creation**: Assign tasks to employees
- **Priority Levels**: Low, medium, high, urgent
- **Status Tracking**: Todo, in progress, completed, cancelled
- **Collaboration**: Comments and updates
- **Due Date Management**: Deadline tracking

### 3. Time Tracking
- **Check-in/Check-out**: Location-based attendance
- **GPS Coordinates**: Location verification
- **Hours Calculation**: Automatic work hour computation
- **Mobile Support**: Mobile-optimized interface
- **Attendance History**: Historical time records

### 4. Notification System
- **Real-time Notifications**: WebSocket-based updates
- **Email Notifications**: SMTP integration
- **Push Notifications**: Service worker implementation
- **Notification Preferences**: User-configurable settings

## Security Features

### 1. Password Security
- **Bcrypt Hashing**: Secure password storage
- **Strength Validation**: Complex password requirements
- **Password Reset**: Secure token-based reset flow
- **Rate Limiting**: Brute force protection

### 2. Email Security
- **Verification Tokens**: Secure email verification
- **Rate Limiting**: Email sending limits
- **IP Tracking**: Request origin tracking
- **Token Expiration**: Time-limited tokens

### 3. Session Security
- **JWT Tokens**: Stateless authentication
- **Token Rotation**: Refresh token mechanism
- **Secure Storage**: HttpOnly cookies (recommended)
- **CORS Protection**: Cross-origin request security

### 4. Input Validation
- **Joi Schemas**: Server-side validation
- **XSS Protection**: Input sanitization
- **SQL Injection Prevention**: Parameterized queries
- **CSRF Protection**: Token-based protection

## Database Schema

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    account_status VARCHAR(20) DEFAULT 'pending_setup' 
        CHECK (account_status IN ('pending_setup', 'active', 'suspended')),
    status VARCHAR(20) DEFAULT 'active' 
        CHECK (status IN ('active', 'inactive', 'terminated')),
    -- Additional fields...
);
```

#### User Roles Table
```sql
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    role_name VARCHAR(50) NOT NULL 
        CHECK (role_name IN ('super-admin', 'hr-admin', 'manager', 'hr-staff', 'employee')),
    permissions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    -- Additional fields...
);
```

#### Authentication Tables
- `password_reset_tokens`: Password reset functionality
- `email_verification_tokens`: Email verification
- `password_reset_attempts`: Rate limiting and security

### Relationships
- Users → Departments (many-to-one)
- Users → Positions (many-to-one)
- Users → Managers (self-referencing)
- Users → Roles (one-to-many)
- Tasks → Users (many-to-one for assignment)

## API Endpoints

### Authentication Endpoints
```
POST /api/auth/register          - User registration
POST /api/auth/login             - User login
POST /api/auth/google            - Google OAuth
POST /api/auth/forgot-password   - Password reset request
POST /api/auth/reset-password    - Password reset confirmation
GET  /api/auth/verify-email/:token - Email verification
POST /api/auth/resend-verification - Resend verification email
POST /api/auth/logout            - User logout
GET  /api/auth/me                - Get current user
PUT  /api/auth/profile           - Update user profile
```

### Protected Endpoints
```
GET  /api/employees              - List employees (role-based)
POST /api/employees              - Create employee (hr-admin+)
PUT  /api/employees/:id          - Update employee (manager+)
DELETE /api/employees/:id        - Delete employee (hr-admin+)

GET  /api/tasks                  - List tasks (role-based)
POST /api/tasks                  - Create task (manager+)
PUT  /api/tasks/:id              - Update task (assigned user+)

POST /api/time-tracking/checkin  - Check in (employee+)
POST /api/time-tracking/checkout - Check out (employee+)
GET  /api/time-tracking/history  - Attendance history
```

### System Endpoints
```
GET  /api/system/status          - System initialization status
POST /api/system/initialize      - Initialize system (first-time setup)
```

## Error Handling

### Custom Error Classes
- `ValidationError`: Input validation failures
- `AuthenticationError`: Login/auth failures
- `ConflictError`: Resource conflicts (duplicate email)
- `EmailVerificationError`: Email verification issues
- `AppError`: General application errors

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"],
  "statusCode": 400
}
```

## Environment Configuration

### Required Environment Variables
```env
# Database
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Email
CEO_EMAIL=ceo@go3net.com

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## Deployment Considerations

### Security Checklist
- [ ] Secure JWT secret generation
- [ ] HTTPS enforcement
- [ ] CORS configuration
- [ ] Rate limiting implementation
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection

### Performance Optimization
- [ ] Database indexing
- [ ] Query optimization
- [ ] Caching strategy
- [ ] CDN for static assets
- [ ] Compression middleware
- [ ] Connection pooling

### Monitoring & Logging
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Security event logging
- [ ] User activity tracking
- [ ] System health checks

This documentation provides a comprehensive overview of the HR Management System's authentication and functionality. The system implements modern security practices with role-based access control, comprehensive error handling, and a scalable architecture suitable for enterprise use.