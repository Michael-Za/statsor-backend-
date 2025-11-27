import React, { useState } from 'react';
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../contexts/auth/AuthContext';
import { subscriptionService } from '../services/auth/subscriptionService';
import { useTheme } from '../contexts/ui/ThemeContext';
import { demoAccountService } from '../services/auth/demoAccountService';
import { notificationService } from '../services/auth/notificationService';
import { emailService } from '../services/auth/emailService';
import { motion } from 'framer-motion';

import { toast } from 'sonner';
import { Loader2, Mail, Lock, Eye, EyeOff, User, MapPin, Target, Play } from 'lucide-react';

const SignUp = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    location: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const { signUp, signInWithGoogle, user, setUser } = useAuth();

  const navigate = useNavigate();

  // Prevent multiple sign-up attempts
  useEffect(() => {
    if (loading || googleLoading) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [loading, googleLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading || googleLoading) {
      toast.error('Please wait, registration in progress...');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!acceptTerms) {
      toast.error('You must accept the terms and conditions');
      return;
    }

    setLoading(true);

    try {
      console.log('[SignUp] Attempting email registration...');
      const result = await signUp(formData.email, formData.password, {
        name: formData.name,
        location: formData.location,
        created_at: new Date().toISOString()
      });

      if (result.error) {
        console.error('[SignUp] Registration error:', result.error);
        toast.error(typeof result.error === 'string' ? result.error : 'Registration failed. Please try again.');
      } else {
        console.log('[SignUp] Registration successful');
        // Initialize subscription for new user
        subscriptionService.initializeUserSubscription(formData.email);

        // Send welcome email
        try {
          await emailService.sendWelcomeEmail({
            name: formData.name,
            email: formData.email
          });
        } catch (emailError) {
          console.warn('[SignUp] Failed to send welcome email:', emailError);
        }

        // Send welcome notification - use the user ID from the signup result or fallback to email
        const userId = result.data?.user?.id || user?.id;
        if (userId) {
          try {
            await notificationService.sendWelcomeNotification(userId, {
              name: formData.name,
              email: formData.email,
              isDemoAccount: false
            });
          } catch (notificationError) {
            console.warn('[SignUp] Failed to send welcome notification:', notificationError);
            // Don't fail the entire signup process for notification errors
          }
        }

        toast.success('Account created successfully! Check your email for a welcome message.');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('[SignUp] Unexpected signup error:', error);
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccount = async () => {
    // Always allow demo account creation in all environments
    // Removed the check for VITE_ENABLE_MOCK_AUTH to make demo accounts available in production
    
    if (loading || googleLoading || demoLoading) {
      toast.error('Please wait, authentication in progress...');
      return;
    }

    setDemoLoading(true);
    
    try {
      toast.info('Creating demo account...', { duration: 2000 });
      
      // Create demo user object
      const demoUser: any = {
        id: 'demo_' + Date.now(),
        email: 'demo@statsor.com',
        name: 'Demo User',
        provider: 'email' as const,
        sportSelected: false,
        created_at: new Date().toISOString()
      };
      
      // Initialize demo account data
      const demoData = demoAccountService.initializeDemoAccount();
       
      // Set user in auth context
      setUser(demoUser);
       
      // Store auth data
      const mockToken = 'demo-token-' + Date.now();
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('statsor_user', JSON.stringify(demoUser));
      localStorage.setItem('user_type', 'demo');
      // For demo accounts, set default sport immediately so no selection is needed
      localStorage.setItem('statsor_sport', 'soccer');
      localStorage.setItem('statsor_sport_selection_completed', 'true');
       
      const result = { user: demoUser, error: null };
      
      if (result.error) {
        toast.error('Failed to create demo account. Please try again.');
      } else {
        // Initialize subscription for demo user
        subscriptionService.initializeUserSubscription(result.user.email);
        
        // Send welcome notification - use the demo user ID we created
        try {
          await notificationService.sendWelcomeNotification(demoUser.id, {
            name: demoUser.name,
            email: demoUser.email,
            isDemoAccount: true
          });
        } catch (notificationError) {
          console.warn('Failed to send demo welcome notification:', notificationError);
          // Don't fail the demo account creation for notification errors
        }
        
        toast.success('Demo account created! Welcome to Statsor.');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Demo account creation error:', error);
      toast.error('Error creating demo account. Please try again.');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (loading || googleLoading || demoLoading) {
      toast.error('Please wait, authentication in progress...');
      return;
    }

    setGoogleLoading(true);

    try {
      console.log('[SignUp] Initiating Google OAuth...');
      toast.info('Redirecting to Google for registration...', { duration: 2000 });

      const result = await signInWithGoogle();

      console.log('[SignUp] Google OAuth result:', result);

      if (result.error && !result.error.includes('Authentication in progress')) {
        // Only show error if it's not a redirect (which is expected)
        if (!window.location.href.includes('accounts.google.com')) {
          console.error('[SignUp] Google OAuth error:', result.error);
          toast.error(typeof result.error === 'string' ? result.error : 'Google registration failed');
        }
      } else if (result.data?.user) {
        // This handles the mock/demo case
        console.log('[SignUp] Google OAuth successful');
        // Initialize subscription for new user
        if (result.data.user.email) {
          subscriptionService.initializeUserSubscription(result.data.user.email);

          // Send welcome email
          try {
            await emailService.sendWelcomeEmail({
              name: result.data.user.user_metadata?.name || result.data.user.email.split('@')[0],
              email: result.data.user.email
            });
          } catch (emailError) {
            console.warn('[SignUp] Failed to send welcome email:', emailError);
          }

          // Send welcome notification
          try {
            await notificationService.sendWelcomeNotification(result.data.user.id, {
              name: result.data.user.user_metadata?.name || result.data.user.email,
              email: result.data.user.email,
              isDemoAccount: false
            });
          } catch (notificationError) {
            console.warn('[SignUp] Failed to send welcome notification:', notificationError);
          }
        }
        toast.success('Welcome! Account created successfully with Google. Check your email!');
        // Navigation is handled in the auth context
      }

    } catch (error) {
      console.error('[SignUp] Unexpected Google registration error:', error);
      toast.error('Network error during Google registration. Please check your connection.');
    } finally {
      // Only clear loading if we're still on the same page
      // (not redirected to Google)
      if (!window.location.href.includes('accounts.google.com')) {
        setGoogleLoading(false);
      }
    }
  };

  const { theme } = useTheme();

  // Animation variants for 3D effects
  const floatingVariants = {
    animate: {
      y: [0, -20, 0],
      x: [0, 5, 0],
      rotate: [0, 2, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const backgroundParticles = {
    animate: {
      y: [0, -100, 0],
      x: [0, 50, 0],
      opacity: [0, 1, 0],
      scale: [0, 1, 0],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
        repeatDelay: 2
      }
    }
  };

  return (
      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-all duration-500 relative overflow-hidden bg-black">
        
        {/* Enhanced Animated Starry Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Large Stars */}
          {[...Array(100)].map((_, i) => (
            <motion.div
              key={`star-${i}`}
              className="absolute rounded-full bg-white"
              style={{
                width: Math.random() * 3 + 1,
                height: Math.random() * 3 + 1,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.2, 1, 0.2],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 2
              }}
            />
          ))}
          
          {/* Small Stars */}
          {[...Array(150)].map((_, i) => (
            <motion.div
              key={`small-star-${i}`}
              className="absolute rounded-full bg-white"
              style={{
                width: Math.random() * 2 + 0.5,
                height: Math.random() * 2 + 0.5,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.1, 0.8, 0.1],
              }}
              transition={{
                duration: Math.random() * 4 + 1,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 3
              }}
            />
          ))}
          
          {/* Twinkling Points */}
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={`point-${i}`}
              className="absolute rounded-full bg-blue-400"
              style={{
                width: Math.random() * 4 + 1,
                height: Math.random() * 4 + 1,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1.5, 0.5],
              }}
              transition={{
                duration: Math.random() * 5 + 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 4
              }}
            />
          ))}
          
          {/* Shooting Stars */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={`shooting-star-${i}`}
              className="absolute rounded-full bg-white"
              style={{
                width: Math.random() * 10 + 5,
                height: 2,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                x: [0, Math.random() * 200 + 100],
                y: [0, Math.random() * 100 + 50],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 2 + 1,
                repeat: Infinity,
                repeatDelay: Math.random() * 10 + 5,
                ease: "easeOut",
                delay: Math.random() * 5
              }}
            />
          ))}
          
          {/* Floating Black Points */}
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={`black-point-${i}`}
              className="absolute rounded-full bg-gray-800"
              style={{
                width: Math.random() * 20 + 5,
                height: Math.random() * 20 + 5,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, Math.random() * 30 - 15],
                x: [0, Math.random() * 20 - 10],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: Math.random() * 6 + 4,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
                delay: Math.random() * 3
              }}
            />
          ))}
          
          {/* Pulsating Nebulas */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`nebula-${i}`}
              className="absolute rounded-full bg-purple-500/20 blur-xl"
              style={{
                width: Math.random() * 100 + 50,
                height: Math.random() * 100 + 50,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 5
              }}
            />
          ))}
          
          {/* Drifting Constellations */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={`constellation-${i}`}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                rotate: [0, 360],
                y: [0, Math.random() * 20 - 10],
              }}
              transition={{
                duration: Math.random() * 20 + 20,
                repeat: Infinity,
                ease: "linear",
                delay: Math.random() * 10
              }}
            >
              {/* Small constellation of dots */}
              {[...Array(5)].map((_, j) => (
                <div
                  key={`constellation-dot-${j}`}
                  className="absolute rounded-full bg-yellow-300"
                  style={{
                    width: Math.random() * 2 + 1,
                    height: Math.random() * 2 + 1,
                    left: `${Math.random() * 20 - 10}px`,
                    top: `${Math.random() * 20 - 10}px`,
                  }}
                />
              ))}
            </motion.div>
          ))}
        </div>



      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center space-x-3">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/25">
            <div className="relative">
              <Target className="h-9 w-9 text-white" />
              <motion.div
                className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-bold bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
              Statsor
            </span>
            <span className="text-xs opacity-70 -mt-1">
              Football Analytics
            </span>
          </div>
        </div>
        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-gray-200 bg-clip-text text-transparent"
        >
          Create Account
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-2 text-center text-sm text-gray-300"
        >
          Join thousands of football enthusiasts
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10"
      >
        <div className="bg-gray-900/80 py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-blue-700/30 backdrop-blur-sm">
          {/* Google Sign Up Button */}
          <div className="mb-6">
            <Button
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading || demoLoading}
              variant="outline"
              className="w-full h-12 border-2 border-gray-600 bg-white hover:bg-gray-50 text-gray-900 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin text-blue-600" />
                  <span className="text-gray-700">Creating account with Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-3.15.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="font-medium">Create account with Google</span>
                </>
              )}
            </Button>
            {googleLoading && (
              <p className="text-xs text-gray-400 mt-2 text-center">
                You may be redirected to Google for registration
              </p>
            )}
          </div>

          {/* Demo Account Button */}
          {/* Enhanced Demo Account Section */}
          <div className="mb-8 relative">
            {/* Background */}
            <div className="absolute inset-0 bg-gray-800/20 rounded-xl" />
            
            {/* Demo Button */}
            <div className="relative">
              <Button
                onClick={handleDemoAccount}
                disabled={demoLoading || loading || googleLoading}
                className="w-full h-14 bg-gradient-to-r from-gray-900 via-black to-gray-900 border-2 border-gray-700 hover:border-gray-500 text-white font-semibold text-lg shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
              >
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                
                {demoLoading ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin text-purple-400" />
                    <span className="text-gray-200">Creating demo experience...</span>
                  </>
                ) : (
                  <>
                    <div className="mr-3">
                      <Play className="w-6 h-6 text-blue-400" />
                    </div>
                    <span className="text-blue-400 font-bold">
                      Experience Demo Account
                    </span>
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-900 text-gray-400">Or create your account with email</span>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSignUp}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="pl-10 h-12 border-2 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:bg-gray-800/70 transition-all"
                  placeholder="Your full name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10 h-12 border-2 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:bg-gray-800/70 transition-all"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-2">
                Location (optional)
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="location"
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="pl-10 h-12 border-2 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:bg-gray-800/70 transition-all"
                  placeholder="City, Country"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10 h-12 border-2 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:bg-gray-800/70 transition-all"
                  placeholder="Minimum 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="pl-10 pr-10 h-12 border-2 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:bg-gray-800/70 transition-all"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-start">
              <input
                id="accept-terms"
                name="accept-terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-500 bg-gray-800 rounded mt-1"
              />
              <label htmlFor="accept-terms" className="ml-2 block text-sm text-gray-300">
                I accept the{' '}
                <Link to="/terms" className="text-blue-400 hover:text-blue-300 font-medium">
                  terms and conditions
                </Link>{' '}
                and the{' '}
                <Link to="/privacy" className="text-blue-400 hover:text-blue-300 font-medium">
                  privacy policy
                </Link>
              </label>
            </div>

            <div>
              <Button
                type="submit"
                disabled={loading || !acceptTerms}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transition-all duration-200 font-semibold shadow-lg shadow-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <Link to="/signin" className="font-medium text-blue-400 hover:text-blue-300 transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          {/* Privacy Notice */}
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg backdrop-blur-sm">
            <div className="text-xs text-blue-300">
              <p className="font-medium mb-1 text-blue-200">Data we collect:</p>
              <ul className="space-y-1 text-blue-300">
                <li>• Basic profile information (name, email)</li>
                <li>• Profile picture (Google only, optional)</li>
                <li>• Location (optional, for personalization)</li>
                <li>• Account creation date</li>
                <li>• Language preferences</li>
              </ul>
              <p className="mt-2 font-medium text-blue-200">
                All data is encrypted and protected according to GDPR and privacy regulations.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
      </div>
  );
};

export default SignUp;