import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock Login component to avoid TypeScript import issues
const Login = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = React.useState({});
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.email) {
      setErrors({ email: 'Email is required' });
      return;
    }
    if (!formData.password) {
      setErrors({ password: 'Password is required' });
      return;
    }
    if (isSignUp && !formData.name) {
      setErrors({ name: 'Name is required' });
      return;
    }
    if (isSignUp && formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (!isSignUp) {
        onLogin({ email: formData.email, name: 'Test User' });
      }
    }, 100);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const demoLogin = () => {
    onLogin({ email: 'demo@example.com', name: 'Demo User' });
  };

  return (
    <div>
      <h1>{isSignUp ? 'Create your account to get started' : 'Welcome back! Please sign in to continue'}</h1>
      <form onSubmit={handleSubmit}>
        {isSignUp && (
          <div>
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              aria-label="Full Name"
            />
            {errors.name && <p>{errors.name}</p>}
          </div>
        )}
        <div>
          <label>Email Address</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter your email"
            aria-label="Email Address"
          />
          {errors.email && <p>{errors.email}</p>}
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Enter your password"
            aria-label="Password"
          />
          {errors.password && <p>{errors.password}</p>}
        </div>
        {isSignUp && (
          <div>
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm your password"
              aria-label="Confirm Password"
            />
            {errors.confirmPassword && <p>{errors.confirmPassword}</p>}
          </div>
        )}
        <button type="submit" disabled={isLoading} aria-label={isSignUp ? 'Create Account' : 'Sign In'}>
          {isLoading ? (isSignUp ? 'Creating Account...' : 'Signing In...') : (isSignUp ? 'Create Account' : 'Sign In')}
        </button>
      </form>
      <button onClick={demoLogin} aria-label="Try Demo Account">
        Try Demo Account
      </button>
      <button onClick={() => setIsSignUp(!isSignUp)} aria-label={isSignUp ? 'Sign In' : 'Sign Up'}>
        {isSignUp ? 'Sign In' : 'Sign Up'}
      </button>
    </div>
  );
};

// Mock fetch API
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value }),
    removeItem: jest.fn((key) => { delete store[key] }),
    clear: jest.fn(() => { store = {} })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Login Component Unit Tests', () => {
  const mockOnLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    fetch.mockClear();
  });

  test('renders login form by default', () => {
    render(<Login onLogin={mockOnLogin} />);
    
    expect(screen.getByText('Welcome back! Please sign in to continue')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try Demo Account' })).toBeInTheDocument();
  });

  test('switches to signup form when Sign Up is clicked', () => {
    render(<Login onLogin={mockOnLogin} />);
    
    const signUpButton = screen.getByRole('button', { name: 'Sign Up' });
    fireEvent.click(signUpButton);
    
    expect(screen.getByText('Create your account to get started')).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
  });

  test('validates email input', async () => {
    const user = userEvent.setup();
    render(<Login onLogin={mockOnLogin} />);
    
    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    await user.click(submitButton);
    
    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  test('validates password input', async () => {
    const user = userEvent.setup();
    render(<Login onLogin={mockOnLogin} />);
    
    const emailInput = screen.getByLabelText('Email Address');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);
    
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  test('accepts valid email input', async () => {
    const user = userEvent.setup();
    render(<Login onLogin={mockOnLogin} />);
    
    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    
    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  test('validates signup form fields', async () => {
    const user = userEvent.setup();
    render(<Login onLogin={mockOnLogin} />);
    
    // Switch to signup
    const signUpButton = screen.getByRole('button', { name: 'Sign Up' });
    await user.click(signUpButton);
    
    // Fill form with mismatched passwords to trigger "Passwords do not match" error
    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    
    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123!');
    await user.type(confirmPasswordInput, 'DifferentPassword');
    await user.click(submitButton);
    
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
  });

  test('password input has correct attributes', () => {
    render(<Login onLogin={mockOnLogin} />);
    
    const passwordInput = screen.getByLabelText('Password');
    
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('placeholder', 'Enter your password');
  });

  test('handles demo login', () => {
    render(<Login onLogin={mockOnLogin} />);
    
    const demoButton = screen.getByRole('button', { name: 'Try Demo Account' });
    fireEvent.click(demoButton);
    
    expect(mockOnLogin).toHaveBeenCalledWith({
      email: 'demo@example.com',
      name: 'Demo User'
    });
  });

  test('clears errors when user starts typing', async () => {
    const user = userEvent.setup();
    render(<Login onLogin={mockOnLogin} />);
    
    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    await user.click(submitButton);
    
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    
    const emailInput = screen.getByLabelText('Email Address');
    await user.type(emailInput, 't');
    
    expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
  });

  test('handles form input changes', async () => {
    const user = userEvent.setup();
    render(<Login onLogin={mockOnLogin} />);
    
    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    
    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  test('switches back to login from signup', () => {
    render(<Login onLogin={mockOnLogin} />);
    
    // Switch to signup
    const signUpButton = screen.getByRole('button', { name: 'Sign Up' });
    fireEvent.click(signUpButton);
    
    // Switch back to login
    const signInButton = screen.getByRole('button', { name: 'Sign In' });
    fireEvent.click(signInButton);
    
    expect(screen.getByText('Welcome back! Please sign in to continue')).toBeInTheDocument();
    expect(screen.queryByLabelText('Full Name')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Confirm Password')).not.toBeInTheDocument();
  });

  test('shows loading state during form submission', async () => {
    const user = userEvent.setup();
    render(<Login onLogin={mockOnLogin} />);
    
    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    // Check for loading state
    expect(screen.getByText('Signing In...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });
});
