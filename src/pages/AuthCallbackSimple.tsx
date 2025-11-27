import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { userInitializationService } from '../services/userInitializationService';

const AuthCallbackSimple = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [status, setStatus] = useState('Processing authentication...');
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    const debug: string[] = [];

    const addDebug = (msg: string) => {
      debug.push(msg);
      console.log('[AuthCallback]', msg);
      if (mounted) setDebugInfo([...debug]);
    };

    const handleCallback = async () => {
      // Safety timeout - if we get stuck for more than 15 seconds, force redirect
      const safetyTimeout = setTimeout(() => {
        if (mounted) {
          console.warn('[AuthCallback] Safety timeout triggered');
          const currentSession = localStorage.getItem('statsor_user');
          if (currentSession) {
            toast.error('Authentication took too long, but you might be logged in. Redirecting...');
            navigate('/dashboard', { replace: true });
          } else {
            setError('Authentication timed out. Please try again.');
            toast.error('Authentication timed out');
            setTimeout(() => navigate('/signin', { replace: true }), 2000);
          }
        }
      }, 15000);

      try {
        addDebug('Starting OAuth callback...');
        addDebug(`URL: ${window.location.href}`);

        setStatus('Checking URL parameters...');

        // Check if we have hash parameters (implicit flow)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const errorParam = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        addDebug(`Has access_token: ${!!accessToken}`);
        addDebug(`Has refresh_token: ${!!refreshToken}`);

        // Check for OAuth errors
        if (errorParam) {
          throw new Error(`OAuth error: ${errorDescription || errorParam}`);
        }

        let session;

        if (accessToken) {
          // We have tokens in the URL hash - set the session directly
          setStatus('Establishing session with tokens...');
          addDebug('Setting session with tokens from URL');

          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          });

          if (sessionError) {
            addDebug(`Session error: ${sessionError.message}`);
            throw new Error(`Failed to establish session: ${sessionError.message}`);
          }

          session = data.session;
          addDebug('Session established successfully');
        } else {
          // Try to get existing session (PKCE flow)
          setStatus('Checking for existing session...');
          addDebug('No tokens in URL, checking for existing session');

          const { data: { session: existingSession }, error: sessionError } = await supabase.auth.getSession();

          if (sessionError) {
            addDebug(`Session retrieval error: ${sessionError.message}`);
            throw new Error(`Session error: ${sessionError.message}`);
          }

          session = existingSession;
        }

        if (!session) {
          addDebug('No session available');
          throw new Error('No session found after Google authentication');
        }

        addDebug(`Session user: ${session.user.email}`);

        if (!mounted) return;

        setStatus('Initializing user data...');
        const user = session.user;
        addDebug(`User ID: ${user.id}`);

        // Use centralized initialization service
        const metadata = user.user_metadata || {};
        const firstName = metadata['given_name'] || metadata['name']?.split(' ')[0] || '';
        const lastName = metadata['family_name'] || metadata['name']?.split(' ').slice(1).join(' ') || '';

        addDebug('Initializing data space...');

        // This handles profile creation, team creation, subscription, and race conditions
        const dataSpace = await userInitializationService.initializeUserDataSpace(
          user.id,
          user.email!,
          firstName,
          lastName,
          'soccer' // Default sport, user can change later
        );

        if (!dataSpace || 'error' in dataSpace) {
          const errorMsg = dataSpace && 'error' in dataSpace ? dataSpace.error : 'Data space initialization failed';
          addDebug(`Initialization error: ${errorMsg}`);
          throw new Error(errorMsg);
        }

        addDebug('Data space initialized successfully');

        // Get the profile to check sport selection status
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('auth_user_id', user.id)
          .single();

        if (!mounted) return;

        setStatus('Finalizing sign-in...');
        addDebug('Saving user data to localStorage...');

        // Create user profile object
        const userProfile = {
          id: user.id,
          email: user.email || '',
          name: metadata['name'] || user.email?.split('@')[0] || 'User',
          picture: metadata['avatar_url'] || metadata['picture'],
          provider: 'google' as const,
          sportSelected: profile?.sport_selected || false,
          sport: profile?.sport as 'soccer' | 'futsal' | undefined,
          userNumber: profile?.user_number
        };

        // Save to localStorage using sessionManager for consistency
        const sessionData = {
          token: session.access_token,
          refreshToken: session.refresh_token ?? undefined,
          expiresAt: new Date(session.expires_at ?? Date.now() + 30 * 24 * 60 * 60 * 1000).getTime(),
          userId: user.id,
          profileId: profile?.id
        };

        // Use sessionManager to save (handles secureStorage and broadcasting)
        // We need to dynamically import or use the one from context if possible, 
        // but importing directly is safer here to ensure it runs
        const { sessionManager } = await import('../utils/sessionManager');
        sessionManager.saveSession(sessionData);

        localStorage.setItem('statsor_user', JSON.stringify(userProfile));
        localStorage.setItem('user_type', 'real');

        addDebug('User data saved');

        // Update auth context
        setUser(userProfile);
        addDebug('Auth context updated');

        clearTimeout(safetyTimeout); // Clear safety timeout
        setStatus('Success! Redirecting...');
        toast.success('Welcome! Successfully signed in with Google.');

        // Redirect based on sport selection
        const redirectPath = !profile?.sport_selected ? '/select-sport' : '/dashboard';
        addDebug(`Redirecting to: ${redirectPath}`);

        setTimeout(() => {
          navigate(redirectPath, { replace: true });
        }, 1000);

      } catch (err: any) {
        clearTimeout(safetyTimeout); // Clear safety timeout
        console.error('[AuthCallback] Error:', err);
        addDebug(`ERROR: ${err.message}`);
        setError(err.message || 'Authentication failed');
        setStatus('Authentication failed');
        toast.error(err.message || 'Authentication failed. Please try again.');

        setTimeout(() => {
          navigate('/signin', { replace: true });
        }, 3000);
      }
    };

    handleCallback();

    return () => {
      mounted = false;
    };
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center max-w-2xl p-8">
        {!error ? (
          <>
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {status}
            </h2>
            <p className="text-gray-600 mb-4">
              Please wait while we complete your sign-in
            </p>
            <div className="mt-6 text-sm text-gray-500">
              This usually takes just a few seconds
            </div>
            {debugInfo.length > 0 && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Show debug info
                </summary>
                <div className="mt-2 p-4 bg-gray-100 rounded text-xs font-mono text-left max-h-60 overflow-y-auto">
                  {debugInfo.map((info, i) => (
                    <div key={i} className="mb-1">{info}</div>
                  ))}
                </div>
              </details>
            )}
          </>
        ) : (
          <>
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Authentication Error
            </h2>
            <p className="text-red-600 mb-4">{error}</p>
            <p className="text-gray-600 mb-4">
              Redirecting you back to sign in...
            </p>
            {debugInfo.length > 0 && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Show debug info
                </summary>
                <div className="mt-2 p-4 bg-gray-100 rounded text-xs font-mono text-left max-h-60 overflow-y-auto">
                  {debugInfo.map((info, i) => (
                    <div key={i} className="mb-1">{info}</div>
                  ))}
                </div>
              </details>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallbackSimple;
