import React from 'react'
import { render, screen, fireEvent } from '../../utils/test-utils'
import { Input } from '../../../components/common'

describe('Input', () => {
  it('renders input with label', () => {
    render(<Input label="Email" />)
    
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('shows required indicator when required', () => {
    render(<Input label="Email" required />)
    
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('displays error message', () => {
    render(<Input label="Email" error="Email is required" />)
    
    expect(screen.getByText('Email is required')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveClass('input-error')
  })

  it('displays helper text', () => {
    render(<Input label="Password" helperText="Must be at least 8 characters" />)
    
    expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument()
  })

  it('handles input changes', () => {
    const handleChange = jest.fn()
    
    render(<Input label="Email" onChange={handleChange} />)
    
    const input = screen.getByLabelText('Email')
    fireEvent.change(input, { target: { value: 'test@example.com' } })
    
    expect(handleChange).toHaveBeenCalled()
    expect(input).toHaveValue('test@example.com')
  })

  it('applies size classes correctly', () => {
    render(<Input label="Email" inputSize="lg" />)
    
    const wrapper = screen.getByLabelText('Email').closest('.input-wrapper')
    expect(wrapper).toHaveClass('input-wrapper-lg')
  })

  it('applies variant classes correctly', () => {
    render(<Input label="Email" variant="filled" />)
    
    const wrapper = screen.getByLabelText('Email').closest('.input-wrapper')
    expect(wrapper).toHaveClass('input-wrapper-filled')
  })

  it('applies fullWidth class when specified', () => {
    render(<Input label="Email" fullWidth />)
    
    const wrapper = screen.getByLabelText('Email').closest('.input-wrapper')
    expect(wrapper).toHaveClass('input-wrapper-full-width')
  })

  it('can be disabled', () => {
    render(<Input label="Email" disabled />)
    
    const input = screen.getByLabelText('Email')
    expect(input).toBeDisabled()
  })

  it('supports different input types', () => {
    render(<Input label="Password" type="password" />)
    
    const input = screen.getByLabelText('Password')
    expect(input).toHaveAttribute('type', 'password')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>()
    render(<Input label="Email" ref={ref} />)
    
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('generates unique id when not provided', () => {
    render(
      <>
        <Input label="Email 1" />
        <Input label="Email 2" />
      </>
    )
    
    const input1 = screen.getByLabelText('Email 1')
    const input2 = screen.getByLabelText('Email 2')
    
    expect(input1.id).not.toBe(input2.id)
    expect(input1.id).toBeTruthy()
    expect(input2.id).toBeTruthy()
  })
})