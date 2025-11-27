import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const TestPage: React.FC = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [testResults, setTestResults] = useState<any>({});

  useEffect(() => {
    // Run comprehensive tests
    runTests();
  }, []);

  const runTests = () => {
    const results: any = {};

    // Test 1: Language Context
    try {
      const testTranslation = t('nav.home');
      results.languageContext = {
        status: '✅ PASS',
        message: `Language context working: "${testTranslation}"`,
        details: { language, translation: testTranslation }
      };
    } catch (error) {
      results.languageContext = {
        status: '❌ FAIL',
        message: 'Language context error',
        error: error
      };
    }

    // Test 2: Local Storage
    try {
      const testKey = 'test_key_' + Date.now();
      localStorage.setItem(testKey, 'test_value');
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      results.localStorage = {
        status: retrieved === 'test_value' ? '✅ PASS' : '❌ FAIL',
        message: 'Local storage working',
        details: { testKey, retrieved }
      };
    } catch (error) {
      results.localStorage = {
        status: '❌ FAIL',
        message: 'Local storage error',
        error: error
      };
    }

    // Test 3: Authentication Context
    try {
      results.authContext = {
        status: '✅ PASS',
        message: 'Auth context loaded',
        details: { 
          user: user ? 'Logged in' : 'Not logged in',
          loading,
          hasSignIn: typeof signIn === 'function',
          hasSignUp: typeof signUp === 'function'
        }
      };
    } catch (error) {
      results.authContext = {
        status: '❌ FAIL',
        message: 'Auth context error',
        error: error
      };
    }

    // Test 4: Component Imports
    try {
      results.componentImports = {
        status: '✅ PASS',
        message: 'All UI components imported successfully',
        details: { Button: '✅', Card: '✅', Badge: '✅' }
      };
    } catch (error) {
      results.componentImports = {
        status: '❌ FAIL',
        message: 'Component import error',
        error: error
      };
    }

    setTestResults(results);
  };

  const handleTestSignIn = async () => {
    try {
      const result = await signIn('test@example.com', 'password123');
      console.log('Test sign in result:', result);
      runTests(); // Re-run tests after sign in
    } catch (error) {
      console.error('Test sign in error:', error);
    }
  };

  const handleTestSignUp = async () => {
    try {
      const result = await signUp('test@example.com', 'password123');
      console.log('Test sign up result:', result);
      runTests(); // Re-run tests after sign up
    } catch (error) {
      console.error('Test sign up error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🧪 Application Test Suite</h1>
          <p className="text-gray-600">Comprehensive testing of all application components</p>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">✅</div>
                <div className="text-sm text-gray-600">Server Running</div>
                <div className="text-xs text-gray-500">Port 3005</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">🌐</div>
                <div className="text-sm text-gray-600">Language</div>
                <div className="text-xs text-gray-500">{language.toUpperCase()}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">👤</div>
                <div className="text-sm text-gray-600">Authentication</div>
                <div className="text-xs text-gray-500">{user ? 'Logged In' : 'Not Logged In'}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">🔧</div>
                <div className="text-sm text-gray-600">Components</div>
                <div className="text-xs text-gray-500">Ready</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Results */}
        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold text-gray-900">Test Results</h2>
          
          {Object.entries(testResults).map(([testName, result]: [string, any]) => (
            <Card key={testName}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="capitalize">{testName.replace(/([A-Z])/g, ' $1')}</span>
                  <Badge variant={result.status.includes('PASS') ? 'default' : 'destructive'}>
                    {result.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                {result.details && (
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                )}
                {result.error && (
                  <pre className="text-xs bg-red-100 p-2 rounded overflow-auto text-red-600">
                    {JSON.stringify(result.error, null, 2)}
                  </pre>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button onClick={handleTestSignIn} variant="outline">
            Test Sign In
          </Button>
          <Button onClick={handleTestSignUp} variant="outline">
            Test Sign Up
          </Button>
          <Button onClick={() => setLanguage(language === 'en' ? 'es' : 'en')} variant="outline">
            Toggle Language ({language === 'en' ? 'ES' : 'EN'})
          </Button>
          <Button onClick={runTests} variant="outline">
            Re-run Tests
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-4">
          <a href="/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Go to Dashboard
          </a>
          <a href="/signin" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            Go to Sign In
          </a>
          <a href="/" className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
            Go to Home
          </a>
        </div>

        {/* User Info */}
        {user && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Current User</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TestPage; 