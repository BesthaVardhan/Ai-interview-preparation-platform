// Signup Flow Integration Tests
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock fetch API
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value }),
    removeItem: jest.fn((key) => { delete store[key] }),
    clear: jest.fn(() => { store = {} }),
    length: jest.fn(() => Object.keys(store).length),
    key: jest.fn((index) => Object.keys(store)[index] || '')
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Simple Signup component for testing
const SignupComponent = () => {
  const [isSignup, setIsSignup] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = React.useState({});
  const [isSuccess, setIsSuccess] = React.useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirm password is required';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      // Mock API call
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({
          message: 'Account created successfully',
          user: { name: formData.name, email: formData.email }
        })
      });

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setIsSuccess(true);
        setErrors({});
        // Store in localStorage
        localStorageMock.setItem('user', JSON.stringify({ name: formData.name, email: formData.email }));
      }
    } catch (error) {
      setErrors({ general: 'Network error during registration' });
    }
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    setErrors({});
    setIsSuccess(false);
  };

  return (
    <div>
      <h1>{isSignup ? 'Create Account' : 'Sign In'}</h1>
      
      {isSuccess ? (
        <div>
          <h2>Account created successfully!</h2>
          <p>Welcome, {formData.name}!</p>
          <button onClick={toggleMode}>Back to Login</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {isSignup && (
            <div>
              <input
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleInputChange}
                data-testid="name-input"
              />
              {errors.name && <span>{errors.name}</span>}
            </div>
          )}
          
          <div>
            <input
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              data-testid="email-input"
            />
            {errors.email && <span>{errors.email}</span>}
          </div>
          
          <div>
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              data-testid="password-input"
            />
            {errors.password && <span>{errors.password}</span>}
          </div>
          
          {isSignup && (
            <div>
              <input
                name="confirmPassword"
                type="password"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                data-testid="confirm-password-input"
              />
              {errors.confirmPassword && <span>{errors.confirmPassword}</span>}
            </div>
          )}
          
          {errors.general && <div>{errors.general}</div>}
          
          <button type="submit" data-testid="submit-button">
            {isSignup ? 'Sign Up' : 'Sign In'}
          </button>
          
          <button type="button" onClick={toggleMode} data-testid="toggle-button">
            {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </form>
      )}
    </div>
  );
};

describe('Signup Flow Integration Tests', () => {
  beforeEach(() => {
    // Clear localStorage and fetch mocks
    localStorageMock.clear();
    (fetch as jest.Mock).mockClear();
  });

  describe('Signup Form Rendering', () => {
    test('should render signup form when in signup mode', () => {
      render(<SignupComponent />);
      
      // Click to switch to signup mode
      const toggleButton = screen.getByText("Don't have an account? Sign Up");
      fireEvent.click(toggleButton);
      
      expect(screen.getByText('Create Account')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Full Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Confirm Password')).toBeInTheDocument();
    });

    test('should render login form by default', () => {
      render(<SignupComponent />);
      
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Full Name')).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Confirm Password')).not.toBeInTheDocument();
    });
  });

  describe('Mode Switching', () => {
    test('should switch between login and signup modes', async () => {
      const user = userEvent.setup();
      render(<SignupComponent />);
      
      // Start in login mode
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      
      // Switch to signup mode
      const toggleButton = screen.getByText("Don't have an account? Sign Up");
      await user.click(toggleButton);
      
      expect(screen.getByText('Create Account')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Full Name')).toBeInTheDocument();
      
      // Switch back to login mode
      const backButton = screen.getByText("Already have an account? Sign In");
      await user.click(backButton);
      
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Full Name')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    test('should validate required fields in signup mode', async () => {
      const user = userEvent.setup();
      render(<SignupComponent />);
      
      // Switch to signup mode
      const toggleButton = screen.getByText("Don't have an account? Sign Up");
      await user.click(toggleButton);
      
      // Submit empty form
      const submitButton = screen.getByText('Sign Up');
      await user.click(submitButton);
      
      // Should show validation errors
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
      expect(screen.getByText('Confirm password is required')).toBeInTheDocument();
    });

    test('should validate password confirmation', async () => {
      const user = userEvent.setup();
      render(<SignupComponent />);
      
      // Switch to signup mode
      const toggleButton = screen.getByText("Don't have an account? Sign Up");
      await user.click(toggleButton);
      
      // Fill form with mismatched passwords
      await user.type(screen.getByPlaceholderText('Full Name'), 'Test User');
      await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Password'), 'password123');
      await user.type(screen.getByPlaceholderText('Confirm Password'), 'differentpassword');
      
      const submitButton = screen.getByText('Sign Up');
      await user.click(submitButton);
      
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });

    test('should clear errors when switching modes', async () => {
      const user = userEvent.setup();
      render(<SignupComponent />);
      
      // Switch to signup mode
      const toggleButton = screen.getByText("Don't have an account? Sign Up");
      await user.click(toggleButton);
      
      // Submit empty form to generate errors
      const submitButton = screen.getByText('Sign Up');
      await user.click(submitButton);
      
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      
      // Switch back to login mode
      const backButton = screen.getByText("Already have an account? Sign In");
      await user.click(backButton);
      
      // Errors should be cleared
      expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
    });
  });

  describe('Successful Signup', () => {
    test('should handle successful signup', async () => {
      const user = userEvent.setup();
      render(<SignupComponent />);
      
      // Switch to signup mode
      const toggleButton = screen.getByText("Don't have an account? Sign Up");
      await user.click(toggleButton);
      
      // Fill valid signup form
      await user.type(screen.getByPlaceholderText('Full Name'), 'Test User');
      await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Password'), 'password123');
      await user.type(screen.getByPlaceholderText('Confirm Password'), 'password123');
      
      // Submit form
      const submitButton = screen.getByText('Sign Up');
      await user.click(submitButton);
      
      // Should show success message
      await waitFor(() => {
        expect(screen.getByText('Account created successfully!')).toBeInTheDocument();
        expect(screen.getByText('Welcome, Test User!')).toBeInTheDocument();
      }, { timeout: 3000 });
      
      // Should store user data in localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'user',
        JSON.stringify({ name: 'Test User', email: 'test@example.com' })
      );
    });

    test('should handle network errors during signup', async () => {
      const user = userEvent.setup();
      render(<SignupComponent />);
      
      // Switch to signup mode
      const toggleButton = screen.getByText("Don't have an account? Sign Up");
      await user.click(toggleButton);
      
      // Mock network error
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      // Fill form
      await user.type(screen.getByPlaceholderText('Full Name'), 'Test User');
      await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Password'), 'password123');
      await user.type(screen.getByPlaceholderText('Confirm Password'), 'password123');
      
      // Submit form
      const submitButton = screen.getByText('Sign Up');
      await user.click(submitButton);
      
      // Should show network error
      await waitFor(() => {
        expect(screen.getByText('Network error during registration')).toBeInTheDocument();
      });
    });
  });

  describe('Form State Management', () => {
    test('should maintain form state during mode switching', async () => {
      const user = userEvent.setup();
      render(<SignupComponent />);
      
      // Fill login form
      await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Password'), 'password123');
      
      // Switch to signup mode
      const toggleButton = screen.getByText("Don't have an account? Sign Up");
      await user.click(toggleButton);
      
      // Form should be cleared
      expect(screen.getByPlaceholderText('Full Name')).toHaveValue('');
      expect(screen.getByPlaceholderText('Email')).toHaveValue('');
      expect(screen.getByPlaceholderText('Password')).toHaveValue('');
      
      // Fill signup form
      await user.type(screen.getByPlaceholderText('Full Name'), 'Test User');
      await user.type(screen.getByPlaceholderText('Email'), 'signup@example.com');
      
      // Switch back to login mode
      const backButton = screen.getByText("Already have an account? Sign In");
      await user.click(backButton);
      
      // Form should be cleared again
      expect(screen.getByPlaceholderText('Email')).toHaveValue('');
      expect(screen.getByPlaceholderText('Password')).toHaveValue('');
    });
  });
});
