import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, User, Shield, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (userData: { email: string; name: string }) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const validatePassword = (password: string) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    return requirements;
  };

  const getPasswordStrength = (password: string) => {
    const requirements = validatePassword(password);
    const score = Object.values(requirements).filter(Boolean).length;
    
    if (score < 2) return { strength: 'weak', color: 'red', percentage: 20 };
    if (score < 4) return { strength: 'medium', color: 'yellow', percentage: 60 };
    if (score === 5) return { strength: 'strong', color: 'green', percentage: 100 };
    return { strength: 'fair', color: 'orange', percentage: 40 };
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (isSignUp && !formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (isSignUp) {
      const requirements = validatePassword(formData.password);
      if (!requirements.length) {
        newErrors.password = 'Password must be at least 8 characters long';
      } else if (!requirements.uppercase) {
        newErrors.password = 'Password must contain at least one uppercase letter';
      } else if (!requirements.lowercase) {
        newErrors.password = 'Password must contain at least one lowercase letter';
      } else if (!requirements.number) {
        newErrors.password = 'Password must contain at least one number';
      }
    }
    // Removed the minimum password length check for sign in to allow correct credentials

    if (isSignUp && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) {
      setErrors({ general: 'Account temporarily locked due to multiple failed attempts. Please try again later.' });
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    
    // Simulate API call delay
    setTimeout(async () => {
      if (isSignUp) {
        // For sign up, call the registration API
        try {
          const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              name: formData.name || formData.email.split('@')[0], 
              email: formData.email,
              password: formData.password 
            })
          });

          const data = await response.json();

          if (response.ok) {
            setIsLoading(false);
            // Show success message and switch to sign-in mode
            setErrors({ general: '✅ Account created successfully! Please sign in to continue.' });
            setIsSignUp(false);
            setFormData({ name: '', email: formData.email, password: '', confirmPassword: '' }); // Keep email for convenience
          } else {
            setErrors({ general: data.error || 'Registration failed' });
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Registration error:', error);
          setErrors({ general: 'Network error during registration' });
          setIsLoading(false);
        }
      } else {
        // For sign in, call the login API
        try {
          console.log('Attempting login with:', { email: formData.email, password: formData.password });
          
          const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email: formData.email,
              password: formData.password 
            })
          });

          const data = await response.json();
          console.log('Login response:', data);

          if (response.ok) {
            // Successful login - store JWT token and user data
            localStorage.setItem('jwt_token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setLoginAttempts(0);
            setIsLoading(false);
            console.log('Login successful, calling onLogin with:', data.user);
            onLogin(data.user);
          } else {
            // Failed login - handle server error messages
            const newAttempts = loginAttempts + 1;
            setLoginAttempts(newAttempts);
            
            if (data.error?.includes('locked')) {
              setIsLocked(true);
              setErrors({ general: data.error });
              setTimeout(() => {
                setIsLocked(false);
                setLoginAttempts(0);
              }, 30000);
            } else if (newAttempts >= 3) {
              setIsLocked(true);
              setErrors({ general: 'Too many failed attempts. Account locked for security.' });
              setTimeout(() => {
                setIsLocked(false);
                setLoginAttempts(0);
              }, 30000);
            } else {
              setErrors({ 
                general: data.error || `Invalid email or password. ${3 - newAttempts} attempts remaining.` 
              });
            }
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Login error:', error);
          setErrors({ general: 'Network error during login' });
          setIsLoading(false);
        }
      }
    }, 1000); // Reduced delay for better UX
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name] || errors.general) {
      setErrors(prev => ({ ...prev, [name]: '', general: '' }));
    }
  };

  const demoLogin = () => {
    const demoUser = {
      email: 'demo@example.com',
      name: 'Demo User'
    };
    localStorage.setItem('user', JSON.stringify(demoUser));
    onLogin(demoUser);
  };

  
  const passwordStrength = getPasswordStrength(formData.password);
  const passwordRequirements = validatePassword(formData.password);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mb-6 shadow-2xl">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            AI Interview Prep
          </h1>
          <p className="text-gray-300 text-lg">
            {isSignUp ? 'Create your account to get started' : 'Welcome back! Please sign in to continue'}
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
          {errors.general && (
            <div className={`mb-6 p-4 border rounded-xl flex items-center space-x-3 ${
              errors.general.includes('✅') 
                ? 'bg-green-500/20 border-green-500/30' 
                : 'bg-red-500/20 border-red-500/30'
            }`}>
              {errors.general.includes('✅') ? (
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              )}
              <p className={`text-sm ${
                errors.general.includes('✅') ? 'text-green-200' : 'text-red-200'
              }`}>{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-200 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-white placeholder-gray-400 ${
                      errors.name ? 'border-red-500' : 'border-white/30'
                    }`}
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-white placeholder-gray-400 ${
                    errors.email ? 'border-red-500' : 'border-white/30'
                  }`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-12 py-3 bg-white/10 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-white placeholder-gray-400 ${
                    errors.password ? 'border-red-500' : 'border-white/30'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
              
              {/* Password strength indicator for sign up */}
              {isSignUp && formData.password && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-300">Password Strength</span>
                    <span className={`text-xs font-medium ${
                      passwordStrength.color === 'green' ? 'text-green-400' :
                      passwordStrength.color === 'yellow' ? 'text-yellow-400' :
                      passwordStrength.color === 'orange' ? 'text-orange-400' : 'text-red-400'
                    }`}>
                      {passwordStrength.strength.toUpperCase()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength.color === 'green' ? 'bg-green-500' :
                        passwordStrength.color === 'yellow' ? 'bg-yellow-500' :
                        passwordStrength.color === 'orange' ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${passwordStrength.percentage}%` }}
                    ></div>
                  </div>
                  <div className="mt-2 space-y-1">
                    {Object.entries(passwordRequirements).map(([key, met]) => (
                      <div key={key} className="flex items-center space-x-2 text-xs">
                        {met ? (
                          <CheckCircle className="w-3 h-3 text-green-400" />
                        ) : (
                          <XCircle className="w-3 h-3 text-gray-500" />
                        )}
                        <span className={met ? 'text-green-400' : 'text-gray-400'}>
                          {key === 'length' && '8+ characters'}
                          {key === 'uppercase' && 'Uppercase letter'}
                          {key === 'lowercase' && 'Lowercase letter'}
                          {key === 'number' && 'Number'}
                          {key === 'special' && 'Special character'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isSignUp && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-200 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-white placeholder-gray-400 ${
                      errors.confirmPassword ? 'border-red-500' : 'border-white/30'
                    }`}
                    placeholder="Confirm your password"
                  />
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || isLocked}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </div>
              ) : isLocked ? (
                'Account Locked'
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          {/* Demo Login Button */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/30" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white/10 text-gray-300">Or</span>
              </div>
            </div>
            <button
              onClick={demoLogin}
              className="w-full mt-4 bg-white/10 text-white py-3 rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 border border-white/30"
            >
              Try Demo Account
            </button>
          </div>

          {/* Toggle Sign Up/Sign In */}
          <div className="mt-6 text-center">
            <p className="text-gray-300">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setFormData({ name: '', email: '', password: '', confirmPassword: '' });
                  setErrors({});
                  setLoginAttempts(0);
                  setIsLocked(false);
                }}
                className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 text-center">
          <p className="text-gray-300 text-sm mb-4">Join thousands of users improving their interview skills</p>
          <div className="flex justify-center space-x-6 text-xs text-gray-400">
            <span>✓ AI-Powered Practice</span>
            <span>✓ Real-time Feedback</span>
            <span>✓ Progress Tracking</span>
          </div>
        </div>
      </div>
    </div>
  );
};
