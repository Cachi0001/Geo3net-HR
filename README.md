# Go3net HR Management System

A comprehensive HR Management System built with Express.js backend and React frontend, featuring employee management, recruitment, payroll, performance tracking, check-in/checkout, and task management capabilities.

## Features

### Core HR Modules
- **Employee Management** - Complete employee records and organizational structure
- **Authentication System** - Google OAuth and email/password with role-based access control
- **Check-in/Checkout** - Time tracking with GPS location and mobile support
- **Task Management** - Assignment, tracking, and collaboration tools
- **Recruitment** - Job postings, applications, and interview scheduling
- **Payroll** - Salary processing, deductions, and benefits administration
- **Performance Management** - Reviews, goals, and development tracking
- **Self-Service Portal** - Employee dashboard for personal information and requests

### Technical Features
- Mobile-responsive design with structured CSS architecture
- Push notifications for real-time updates
- Role-based permissions (Super Admin, HR Admin, Manager, HR Staff, Employee)
- Comprehensive audit logging and security
- Modular architecture for easy feature expansion

## Technology Stack

### Backend
- **Framework**: Express.js with TypeScript
- **Database**: Supabase PostgreSQL
- **Authentication**: JWT tokens + Google OAuth
- **Testing**: Jest with Supertest
- **Architecture**: Layered (Controllers → Services → Repositories)

### Frontend
- **Framework**: React with TypeScript
- **Styling**: Structured CSS with mobile-specific files
- **State Management**: Context API
- **Testing**: Jest + React Testing Library

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── models/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── config/
│   ├── database/
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   └── modules/
│   │   ├── styles/
│   │   │   ├── components/
│   │   │   └── mobile/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── utils/
│   └── public/
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure environment variables:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

5. Set up database schema:
```bash
npm run migrate
```

6. Start development server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm start
```

## Database Schema

The system uses a comprehensive PostgreSQL schema with the following core tables:

- **users** - Employee records and authentication
- **departments** - Organizational departments
- **positions** - Job positions and roles
- **user_roles** - Role-based access control
- **check_in_records** - Time tracking and attendance
- **tasks** - Task management and assignment
- **task_comments** - Task collaboration
- **password_reset_tokens** - Password recovery

## Authentication & Authorization

### User Registration Flow
1. User registers with email/password or Google OAuth
2. System assigns default "employee" role
3. User completes mandatory profile fields
4. HR admin can upgrade roles as needed

### Admin-Created Accounts
1. HR admin creates employee record
2. System generates temporary password and sends invitation
3. Employee receives email with login credentials
4. Employee logs in and completes profile setup

### Role Hierarchy
- **Super Admin** - Full system access
- **HR Admin** - Complete HR management
- **Manager** - Team management and oversight
- **HR Staff** - HR operations and recruitment
- **Employee** - Self-service and assigned tasks

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/google` - Google OAuth
- `POST /auth/forgot-password` - Password reset request
- `POST /auth/reset-password` - Password reset

### Employee Management
- `GET /employees` - List employees
- `POST /employees` - Create employee
- `PUT /employees/:id` - Update employee
- `GET /employees/:id` - Get employee details

### Check-in/Checkout
- `POST /checkin` - Check in
- `POST /checkout` - Check out
- `GET /attendance/:userId` - Get attendance records

### Task Management
- `GET /tasks` - List tasks
- `POST /tasks` - Create task
- `PUT /tasks/:id` - Update task
- `POST /tasks/:id/comments` - Add comment

## Testing

### Backend Testing
```bash
cd backend
npm test
npm run test:coverage
```

### Frontend Testing
```bash
cd frontend
npm test
npm run test:coverage
```

## Development Guidelines

### Code Standards
- Maximum 300 lines per file
- Comprehensive test coverage required
- Structured CSS with mobile-specific files
- TypeScript for type safety

### Architecture Principles
- Separation of concerns
- Dependency injection
- Repository pattern for data access
- Service layer for business logic
- Reusable components and utilities

## Contributing

1. Follow the established folder structure
2. Write tests for all new functionality
3. Ensure mobile responsiveness
4. Maintain code quality standards
5. Update documentation as needed

## License

This project is proprietary software developed for Go3net.

## Support

For technical support or questions, please contact the development team.