import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SignUp from '../pages/SignUp';

// Mock the contexts
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    signUp: jest.fn(),
    signInWithGoogle: jest.fn(),
    user: null,
    setUser: jest.fn()
  })
}));

jest.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'dark'
  })
}));

// Mock the services
jest.mock('../services/subscriptionService', () => ({
  subscriptionService: {
    initializeUserSubscription: jest.fn()
  }
}));

jest.mock('../services/demoAccountService', () => ({
  demoAccountService: {
    initializeDemoAccount: jest.fn()
  }
}));

jest.mock('../services/notificationService', () => ({
  notificationService: {
    sendWelcomeNotification: jest.fn()
  }
}));

describe('SignUp Component', () => {
  const renderSignUp = () => {
    return render(
      <BrowserRouter>
        <SignUp />
      </BrowserRouter>
    );
  };

  test('renders signup form', () => {
    renderSignUp();
    
    // Check if the main elements are rendered
    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
  });

  test('renders social signup buttons', () => {
    renderSignUp();
    
    // Check if the social signup buttons are rendered
    expect(screen.getByText('Create account with Google')).toBeInTheDocument();
    expect(screen.getByText('Experience Demo Account')).toBeInTheDocument();
  });
});