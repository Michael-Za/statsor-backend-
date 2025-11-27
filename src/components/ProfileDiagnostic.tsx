import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface DiagnosticResult {
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

export const ProfileDiagnostic = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    const diagnostics: DiagnosticResult[] = [];

    try {
      // Check 1: Authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        diagnostics.push({
          status: 'error',
          message: 'Not authenticated',
          details: authError?.message || 'No user session found'
        });
        setResults(diagnostics);
        setLoading(false);
        return;
      }

      diagnostics.push({
        status: 'success',
        message: 'Authentication OK',
        details: `User ID: ${user.id}`
      });

      // Check 2: Profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (profileError) {
        diagnostics.push({
          status: 'error',
          message: 'Profile lookup failed',
          details: profileError.message
        });
      } else if (!profile) {
        diagnostics.push({
          status: 'warning',
          message: 'No profile found',
          details: 'Profile will be created automatically when you add data'
        });
      } else {
        diagnostics.push({
          status: 'success',
          message: 'Profile found',
          details: `Profile ID: ${profile.id}`
        });

        // Check 3: Team
        const { data: teams, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .eq('manager_id', profile.id);

        if (teamsError) {
          diagnostics.push({
            status: 'error',
            message: 'Team lookup failed',
            details: teamsError.message
          });
        } else if (!teams || teams.length === 0) {
          diagnostics.push({
            status: 'warning',
            message: 'No team found',
            details: 'A team should have been created during signup'
          });
        } else {
          diagnostics.push({
            status: 'success',
            message: `${teams.length} team(s) found`,
            details: teams.map(t => t.name).join(', ')
          });
        }

        // Check 4: Players
        const { data: players, error: playersError } = await supabase
          .from('players')
          .select('id')
          .eq('profile_id', profile.id);

        if (playersError) {
          diagnostics.push({
            status: 'error',
            message: 'Players lookup failed',
            details: playersError.message
          });
        } else {
          diagnostics.push({
            status: 'success',
            message: `${players?.length || 0} player(s) found`,
            details: players?.length ? 'Players data is accessible' : 'No players yet'
          });
        }

        // Check 5: Subscription
        const { data: subscription, error: subError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', profile.id)
          .maybeSingle();

        if (subError) {
          diagnostics.push({
            status: 'warning',
            message: 'Subscription lookup failed',
            details: subError.message
          });
        } else if (!subscription) {
          diagnostics.push({
            status: 'warning',
            message: 'No subscription found',
            details: 'A free subscription should have been created'
          });
        } else {
          diagnostics.push({
            status: 'success',
            message: `Subscription: ${subscription.plan}`,
            details: `Status: ${subscription.status}`
          });
        }
      }
    } catch (error: any) {
      diagnostics.push({
        status: 'error',
        message: 'Diagnostic failed',
        details: error.message
      });
    }

    setResults(diagnostics);
    setLoading(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Profile Diagnostic</h2>
        <Button onClick={runDiagnostics} disabled={loading}>
          {loading ? 'Running...' : 'Refresh'}
        </Button>
      </div>

      <div className="space-y-3">
        {results.map((result, index) => (
          <div
            key={index}
            className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
          >
            <div className="mt-0.5">{getIcon(result.status)}</div>
            <div className="flex-1">
              <p className="font-medium">{result.message}</p>
              {result.details && (
                <p className="text-sm text-gray-600 mt-1">{result.details}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {results.length === 0 && !loading && (
        <p className="text-center text-gray-500 py-8">
          Click "Refresh" to run diagnostics
        </p>
      )}
    </Card>
  );
};
