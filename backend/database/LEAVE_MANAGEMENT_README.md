# Leave Management Database Setup

This directory contains all the database migration files for the Leave Management System.

## Files Overview

### Migration Files
- `005_add_leave_management.sql` - Main migration file that creates all leave management tables
- `006_leave_management_seed_data.sql` - Seed data with default leave types and policies
- `007_rollback_leave_management.sql` - Rollback script to remove all leave management tables

### Setup Scripts
- `LEAVE_MANAGEMENT_SETUP.sql` - Complete setup script that runs both migration and seed data

## Database Schema

### Tables Created

1. **leave_types** - Defines different types of leave (vacation, sick, personal, etc.)
2. **leave_policies** - Defines policies for leave accrual, limits, and rules
3. **employee_leave_policies** - Links employees to specific leave policies
4. **leave_requests** - Stores all leave requests from employees
5. **leave_balances** - Tracks current leave balances for each employee
6. **leave_accrual_history** - Audit trail of all leave accrual transactions

### Key Features

- **Comprehensive Leave Types**: 10 default leave types including annual, sick, maternity, etc.
- **Flexible Policies**: Support for different accrual rates, carryover rules, and probation periods
- **Automatic Balance Calculation**: Generated columns for available leave calculations
- **Audit Trail**: Complete history of all leave accruals and changes
- **Performance Optimized**: Strategic indexes for efficient queries
- **Data Integrity**: Comprehensive constraints and foreign key relationships

## Setup Instructions

### Option 1: Run Complete Setup
```sql
\i backend/database/LEAVE_MANAGEMENT_SETUP.sql
```

### Option 2: Run Individual Files
```sql
-- 1. Create tables and indexes
\i backend/database/005_add_leave_management.sql

-- 2. Insert seed data
\i backend/database/006_leave_management_seed_data.sql
```

### Rollback (if needed)
```sql
\i backend/database/007_rollback_leave_management.sql
```

## Default Leave Types Created

1. **Annual Leave** - 21 days standard, 28 days senior
2. **Sick Leave** - 10 days with monthly accrual
3. **Personal Leave** - 3 days annually
4. **Maternity Leave** - 90 days
5. **Paternity Leave** - 14 days
6. **Bereavement Leave** - 5 days
7. **Emergency Leave** - 30 days (unpaid)
8. **Study Leave** - 5 days for education
9. **Compassionate Leave** - 5 days for family care
10. **Public Holiday** - Statutory holidays

## Default Policies

- **Standard Annual Leave Policy** - 21 days, monthly accrual, 5 days carryover
- **Senior Annual Leave Policy** - 28 days, monthly accrual, 7 days carryover
- **Standard Sick Leave Policy** - 10 days, monthly accrual, 5 days carryover
- **Personal Leave Policy** - 3 days annually, 1 day carryover
- Plus policies for all other leave types

## Automatic Initialization

The setup script automatically:
- Assigns all default policies to existing active employees
- Initializes leave balances for the current year
- Pro-rates allocations for employees hired mid-year
- Sets up proper effective dates based on hire dates

## Security

- Row Level Security (RLS) enabled on all tables
- Basic read policies created (can be customized)
- Proper foreign key constraints for data integrity
- Audit fields (created_by, updated_by) on all relevant tables

## Performance

- Strategic indexes on frequently queried columns
- Composite indexes for complex queries
- Generated columns for calculated values
- Optimized for calendar views and balance lookups