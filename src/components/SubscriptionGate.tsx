import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Lock, Crown, Zap } from 'lucide-react';

interface SubscriptionGateProps {
  children: React.ReactNode;
  feature: 'training' | 'advanced_analytics' | 'tactical_chat' | 'player_pictures' | 'pdf_export';
  requiredPlan?: 'pro' | 'pro_plus';
}

const SubscriptionGate: React.FC<SubscriptionGateProps> = ({ 
  children, 
  feature,
  requiredPlan = 'pro'
}) => {
  const { currentPlan } = useSubscription();

  // Feature access rules
  const hasAccess = () => {
    if (!currentPlan) return false;

    // Free plan restrictions
    if (currentPlan.id === 'free') {
      return false; // Free users don't have access to any premium features
    }

    // Pro plan access
    if (currentPlan.id === 'pro') {
      // Pro has access to most features except Pro Plus exclusives
      if (requiredPlan === 'pro_plus') {
        return false;
      }
      return true;
    }

    // Pro Plus has access to everything
    if (currentPlan.id === 'pro_plus') {
      return true;
    }

    return false;
  };

  const getFeatureName = () => {
    const names = {
      training: 'Training Session Planner',
      advanced_analytics: 'Advanced Analytics Dashboard',
      tactical_chat: 'Tactical Chat',
      player_pictures: 'Player Profile Pictures',
      pdf_export: 'PDF & Excel Exports'
    };
    return names[feature] || 'This Feature';
  };

  if (hasAccess()) {
    return <>{children}</>;
  }

  // Show upgrade prompt
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {getFeatureName()} is a Premium Feature
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-gray-600">
            <p className="mb-4">
              Upgrade to <span className="font-semibold text-blue-600">Pro</span> to unlock this feature and many more!
            </p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Crown className="w-5 h-5 text-blue-600" />
              What you'll get with Pro:
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>50 AI Assistant requests per day (vs 10 on Free)</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Training Session Planner with custom exercises</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Advanced Analytics Dashboard with detailed insights</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Player Profile Pictures</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>PDF & Excel Exports</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Unlimited Players (vs 15 on Free)</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Unlimited Data Retention (vs 30 days on Free)</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Priority Email Support (24h response)</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => window.location.href = '/pricing'}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-lg"
            >
              <Crown className="w-5 h-5 mr-2" />
              Upgrade to Pro - €90/year
            </Button>
            <Button
              onClick={() => window.location.href = '/dashboard'}
              variant="outline"
              className="flex-1 py-6"
            >
              Back to Dashboard
            </Button>
          </div>

          <p className="text-center text-xs text-gray-500">
            Only €7.50/month when billed annually
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionGate;
