import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React, { Suspense, lazy, useEffect } from 'react';
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SportProvider, useSport } from "./contexts/SportContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import { DatabaseProvider } from "./contexts/DatabaseContext";
import { ChatbotProvider } from "./components/ChatbotBackend";
import { SportSelectionModal } from "./components/SportSelectionModal";
import ResponsiveLayout from "./components/ResponsiveLayout";
import ErrorBoundary from "./components/ErrorBoundary";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Pricing = lazy(() => import("./pages/Pricing"));
const SelectSport = lazy(() => import("./pages/SelectSport"));
const Blog = lazy(() => import("./pages/Blog"));
const SignIn = lazy(() => import("./pages/SignIn"));
const SignUp = lazy(() => import("./pages/SignUp"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Training = lazy(() => import("./pages/Training"));
const ValorantAnalysis = lazy(() => import("./pages/ValorantAnalysis"));
const Players = lazy(() => import("./pages/Players"));
const PlayerProfile = lazy(() => import("./pages/PlayerProfile"));
const Matches = lazy(() => import("./pages/Matches"));
const GeneralStats = lazy(() => import("./pages/GeneralStats"));
const Attendance = lazy(() => import("./pages/Attendance"));
const ManualActions = lazy(() => import("./pages/ManualActions"));
const CommandTable = lazy(() => import("./pages/CommandTable"));
const TacticalChat = lazy(() => import("./pages/TacticalChat"));
const AdvancedAnalytics = lazy(() => import("./pages/AdvancedAnalytics"));
const CommunityHub = lazy(() => import("./pages/CommunityHub"));
const DatabaseStatusPage = lazy(() => import("./pages/DatabaseStatusPage"));
// const GoogleCallback = lazy(() => import("./pages/GoogleCallback"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCancel = lazy(() => import("./pages/PaymentCancel"));
const PayPalPayment = lazy(() => import("./pages/PayPalPayment"));
const TestPage = lazy(() => import("./pages/TestPage"));
const PlayerManagement = lazy(() => import("./pages/PlayerManagement"));
const MatchTracking = lazy(() => import("./pages/MatchTracking"));
const TeamManagement = lazy(() => import("./pages/TeamManagement"));
const AIAssistant = lazy(() => import("./pages/AIAssistant"));
const AIAssistantDirect = lazy(() => import("./pages/AIAssistantDirect"));
const TestRender = lazy(() => import("./pages/TestRender"));
const TestAIAssistant = lazy(() => import("./pages/TestAIAssistant"));
const DataManagement = lazy(() => import("./pages/DataManagement"));
const Suggestions = lazy(() => import("./pages/Suggestions"));
const Settings = lazy(() => import("./pages/Settings"));
const Profile = lazy(() => import("./pages/Profile"));
const GeneralNotepad = lazy(() => import("./pages/GeneralNotepad"));
const TestPlayerIntegration = lazy(() => import("./pages/TestPlayerIntegration"));
const DemoPlayerTest = lazy(() => import("./pages/DemoPlayerTest"));
const SubscriptionGate = lazy(() => import("./components/SubscriptionGate"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Require authentication - NO DEMO MODE
  if (!user) {
    console.log('[ProtectedRoute] No authenticated user - redirecting to signin');
    return <Navigate to="/signin" />;
  }

  console.log('[ProtectedRoute] User authenticated:', user.email);
  return <>{children}</>;
};

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
  </div>
);

// Reorganize context providers for better performance
const AppProviders = ({ children }: { children: React.ReactNode }) => (
  <LanguageProvider>
    <ThemeProvider>
      <AuthProvider>
        <SportProvider>
          <DatabaseProvider>
            <SubscriptionProvider>
              <ChatbotProvider>
                <TooltipProvider>
                  {children}
                </TooltipProvider>
              </ChatbotProvider>
            </SubscriptionProvider>
          </DatabaseProvider>
        </SportProvider>
      </AuthProvider>
    </ThemeProvider>
  </LanguageProvider>
);

// Root route handler - redirects based on auth status
const RootRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Otherwise show landing page
  return <Index />;
};

function App() {
  // Clear demo data on app initialization if mock auth is disabled
  useEffect(() => {
    const enableMockAuth = import.meta.env['VITE_ENABLE_MOCK_AUTH'] === 'true';

    // If mock auth is disabled, clear any demo authentication data
    if (!enableMockAuth) {
      // Check if current user is a demo user
      const userProfile = localStorage.getItem('statsor_user');
      if (userProfile) {
        try {
          const parsedUser = JSON.parse(userProfile);
          if (parsedUser.provider === 'demo') {
            // Clear demo authentication data
            localStorage.removeItem('auth_token');
            localStorage.removeItem('statsor_user');
            localStorage.removeItem('statsor_onboarding_completed');
            localStorage.removeItem('user_type');
            localStorage.removeItem('demo_account_data');
            sessionStorage.clear();
          }
        } catch (e) {
          // If there's an error parsing the user profile, clear all auth data
          localStorage.removeItem('auth_token');
          localStorage.removeItem('statsor_user');
          localStorage.removeItem('statsor_onboarding_completed');
          localStorage.removeItem('user_type');
          localStorage.removeItem('demo_account_data');
          sessionStorage.clear();
        }
      }
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppProviders>
            <Toaster />
            <Sonner />
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<RootRoute />} />
                <Route path="/landing" element={<Index />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/select-sport" element={<SelectSport />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/payment-cancel" element={<PaymentCancel />} />
                <Route path="/paypal-payment" element={<PayPalPayment />} />
                <Route path="/test" element={<TestPage />} />

                {/* Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <ResponsiveLayout>
                        <Dashboard />
                      </ResponsiveLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/:userId"
                  element={
                    <ProtectedRoute>
                      <ResponsiveLayout>
                        <Dashboard />
                      </ResponsiveLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/players"
                  element={
                    <ProtectedRoute>
                      <ResponsiveLayout>
                        <PlayerManagement />
                      </ResponsiveLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/player-test"
                  element={
                    <ProtectedRoute>
                      <ResponsiveLayout>
                        <TestPlayerIntegration />
                      </ResponsiveLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/demo-player-test"
                  element={
                    <ProtectedRoute>
                      <ResponsiveLayout>
                        <DemoPlayerTest />
                      </ResponsiveLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/players/:id"
                  element={
                    <ProtectedRoute>
                      <ResponsiveLayout>
                        <PlayerProfile />
                      </ResponsiveLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/matches"
                  element={
                    <ProtectedRoute>
                      <ResponsiveLayout>
                        <Matches />
                      </ResponsiveLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/match-tracking"
                  element={
                    <ProtectedRoute>
                      <ResponsiveLayout>
                        <MatchTracking />
                      </ResponsiveLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/general-stats"
                  element={
                    <ProtectedRoute>
                      <ResponsiveLayout>
                        <GeneralStats />
                      </ResponsiveLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/attendance"
                  element={
                    <ProtectedRoute>
                      <ResponsiveLayout>
                        <Attendance />
                      </ResponsiveLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/manual-actions"
                  element={
                    <ProtectedRoute>
                      <ResponsiveLayout>
                        <ManualActions />
                      </ResponsiveLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/command-table"
                  element={
                    <ProtectedRoute>
                      <ResponsiveLayout>
                        <CommandTable />
                      </ResponsiveLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/data-management"
                  element={
                    <ProtectedRoute>
                      <ResponsiveLayout>
                        <DataManagement />
                      </ResponsiveLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/training"
                  element={
                    <ProtectedRoute>
                      <SubscriptionGate feature="training" requiredPlan="pro">
                        <ResponsiveLayout>
                          <Training />
                        </ResponsiveLayout>
                      </SubscriptionGate>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tactical-chat"
                  element={
                    <ProtectedRoute>
                      <SubscriptionGate feature="tactical_chat" requiredPlan="pro">
                        <ResponsiveLayout>
                          <TacticalChat />
                        </ResponsiveLayout>
                      </SubscriptionGate>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/advanced-analytics"
                  element={
                    <ProtectedRoute>
                      <SubscriptionGate feature="advanced_analytics" requiredPlan="pro">
                        <ResponsiveLayout>
                          <AdvancedAnalytics />
                        </ResponsiveLayout>
                      </SubscriptionGate>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/community"
                  element={
                    <ProtectedRoute>
                      <ResponsiveLayout>
                        <CommunityHub />
                      </ResponsiveLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/database-status"
                  element={
                    <ProtectedRoute>
                      <ResponsiveLayout>
                        <DatabaseStatusPage />
                      </ResponsiveLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/player-management"
                  element={
                    <ProtectedRoute>
                      <ResponsiveLayout>
                        <PlayerManagement />
                      </ResponsiveLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <ProtectedRoute>
                      <ResponsiveLayout>
                        <GeneralNotepad />
                      </ResponsiveLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ai-assistant-direct"
                  element={
                    <ProtectedRoute>
                      <AIAssistantDirect />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ai-assistant-test"
                  element={
                    <ProtectedRoute>
                      <TestAIAssistant />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ai-assistant"
                  element={
                    <ProtectedRoute>
                      <ResponsiveLayout>
                        <AIAssistant />
                      </ResponsiveLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/suggestions"
                  element={
                    <ProtectedRoute>
                      <ResponsiveLayout>
                        <Suggestions />
                      </ResponsiveLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <ResponsiveLayout>
                        <Settings />
                      </ResponsiveLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ResponsiveLayout>
                        <Profile />
                      </ResponsiveLayout>
                    </ProtectedRoute>
                  }
                />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/test-render" element={<TestRender />} />
              </Routes>
            </Suspense>
          </AppProviders>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;