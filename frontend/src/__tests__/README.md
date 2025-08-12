# Frontend Testing Structure

This directory contains all the test files for the frontend application, organized in a clear and maintainable structure.

## Directory Structure

```
__tests__/
├── components/           # Component tests
│   ├── auth/            # Authentication component tests
│   ├── common/          # Common/shared component tests
│   └── employee/        # Employee-specific component tests
├── hooks/               # Custom hook tests
├── services/            # Service layer tests
├── utils/               # Utility function tests
├── setup.ts             # Test setup and configuration
├── test-utils.tsx       # Custom testing utilities
└── README.md           # This file
```

## Testing Philosophy

- **Unit Tests**: Test individual components and functions in isolation
- **Integration Tests**: Test how components work together
- **User-Centric**: Tests focus on user interactions and behavior
- **Accessibility**: Tests include accessibility checks where relevant

## Test Utilities

### `test-utils.tsx`
Provides custom render function with all necessary providers:
- AuthProvider
- ToastProvider  
- LoadingProvider
- BrowserRouter

### `setup.ts`
Global test setup including:
- Jest DOM matchers
- Mock implementations for browser APIs
- Console noise reduction

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test Button.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="renders correctly"
```

## Writing Tests

### Component Tests
```typescript
import React from 'react'
import { render, screen } from '../../__tests__/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { MyComponent } from '../MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })

  it('handles user interactions', async () => {
    const user = userEvent.setup()
    const handleClick = jest.fn()
    
    render(<MyComponent onClick={handleClick} />)
    
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalled()
  })
})
```

### Hook Tests
```typescript
import { renderHook, act } from '@testing-library/react'
import { useMyHook } from '../useMyHook'

describe('useMyHook', () => {
  it('returns expected initial state', () => {
    const { result } = renderHook(() => useMyHook())
    expect(result.current.value).toBe(initialValue)
  })

  it('updates state correctly', () => {
    const { result } = renderHook(() => useMyHook())
    
    act(() => {
      result.current.updateValue('new value')
    })
    
    expect(result.current.value).toBe('new value')
  })
})
```

## Mock Patterns

### API Calls
```typescript
const mockApiCall = jest.fn()
jest.mock('../../hooks/useApi', () => ({
  useApi: () => ({ apiCall: mockApiCall })
}))
```

### Context Values
```typescript
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    login: jest.fn(),
    logout: jest.fn()
  })
}))
```

## Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the user sees and does
2. **Use Semantic Queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Mock External Dependencies**: Mock API calls, external libraries, etc.
4. **Test Error States**: Include tests for loading, error, and empty states
5. **Accessibility**: Test with screen readers in mind
6. **Async Operations**: Use `waitFor` for async operations
7. **User Events**: Use `@testing-library/user-event` for realistic interactions

## Coverage Goals

- **Components**: 90%+ coverage
- **Hooks**: 95%+ coverage  
- **Services**: 85%+ coverage
- **Utils**: 95%+ coverage

## Common Test Scenarios

### Form Components
- Rendering with/without labels
- Validation error display
- User input handling
- Form submission
- Loading/disabled states

### Dashboard Components  
- Data loading states
- Error handling
- Empty states
- User interactions
- Responsive behavior

### Authentication
- Login/logout flows
- Token management
- Protected routes
- Permission checks
- Error scenarios

## Debugging Tests

```bash
# Run single test with debug output
npm test -- --verbose MyComponent.test.tsx

# Debug with browser
npm test -- --debug

# Run with coverage to see untested code
npm run test:coverage
```

## Resources

- [Testing Library Docs](https://testing-library.com/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)