import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('[AuthCallback] Processing backend OAuth callback...');
        console.log('[AuthCallback] Current URL:', window.location.href);

        // Parse URL parameters from backend redirect
        const searchParams = new URLSearchParams(window.location.search);

        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refreshToken');
        const error = searchParams.get('error');

        if (error) {
          console.error('[AuthCallback] OAuth error:', error);
          toast.error(`Authentication failed: ${error}`);
          setTimeout(() => navigate('/signin', { replace: true }), 2000);
          return;
        }

        if (!token) {
          console.error('[AuthCallback] No token received from backend');
          toast.error('Authentication failed. No token received.');
          setTimeout(() => navigate('/signin', { replace: true }), 2000);
          return;
        }

        console.log('[AuthCallback] Tokens received, fetching user data...');

        // Get user data from backend using the token
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const { user } = await response.json();

        if (!user) {
          throw new Error('No user data received');
        }

        console.log('[AuthCallback] User data received:', user.email);

        // Store tokens
        localStorage.setItem('auth_token', token);
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        }
        localStorage.setItem('token_expires_at', (Date.now() + 30 * 24 * 60 * 60 * 1000).toString());

        // Create user profile for AuthContext
        const userProfile = {
          id: user.id,
          email: user.email,
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email.split('@')[0],
          picture: user.avatar_url,
          provider: user.provider || 'google',
          sportSelected: user.sport_selected || false,
          sport: user.sport as 'soccer' | 'futsal' | undefined
        };

        // Store user data
        localStorage.setItem('statsor_user', JSON.stringify(userProfile));
        localStorage.setItem('user_type', 'real');

        // Update AuthContext
        setUser(userProfile);

        console.log('[AuthCallback] Authentication successful');
        toast.success('Welcome! Successfully signed in.');

        // Redirect based on sport selection
        setTimeout(() => {
          if (!user.sport_selected) {
            console.log('[AuthCallback] Redirecting to sport selection...');
            navigate('/select-sport', { replace: true });
          } else {
            console.log('[AuthCallback] Redirecting to dashboard...');
            navigate('/dashboard', { replace: true });
          }
        }, 500);

      } catch (error) {
        console.error('[AuthCallback] Error:', error);
        toast.error('Authentication failed. Please try again.');
        setTimeout(() => navigate('/signin', { replace: true }), 2000);
      }
    };

    handleCallback();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900">Completing sign in...</h2>
        <p className="text-gray-600 mt-2">Please wait while we set up your account</p>
      </div>
    </div>
  );
};

export default AuthCallback;
