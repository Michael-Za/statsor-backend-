import { useSubscription } from '../contexts/SubscriptionContext';
import { toast } from 'sonner';

export const usePlanLimits = () => {
  const { currentPlan, canUseAI, getAIRequestsRemaining } = useSubscription();

  const checkPlayerLimit = async (currentPlayerCount: number): Promise<boolean> => {
    if (!currentPlan) {
      toast.error('Unable to verify subscription plan');
      return false;
    }

    // Unlimited players for Pro and Pro Plus
    if (currentPlan.maxPlayers === -1) {
      return true;
    }

    // Check if limit reached
    if (currentPlayerCount >= currentPlan.maxPlayers) {
      toast.error(
        `Player limit reached! Your ${currentPlan.name} plan allows up to ${currentPlan.maxPlayers} players.`,
        {
          description: 'Upgrade to Pro for unlimited players',
          action: {
            label: 'Upgrade',
            onClick: () => window.location.href = '/pricing'
          }
        }
      );
      return false;
    }

    return true;
  };

  const checkAILimit = (): boolean => {
    if (!currentPlan) {
      toast.error('Unable to verify subscription plan');
      return false;
    }

    if (!canUseAI()) {
      toast.error('AI Assistant is not available on your plan');
      return false;
    }

    const remaining = getAIRequestsRemaining();
    
    // Unlimited for Pro Plus
    if (remaining === -1) {
      return true;
    }

    if (remaining <= 0) {
      toast.error(
        `AI request limit reached! Your ${currentPlan.name} plan allows ${currentPlan.aiRequestsPerDay} requests per day.`,
        {
          description: 'Upgrade to Pro for 50 requests/day or Pro Plus for unlimited',
          action: {
            label: 'Upgrade',
            onClick: () => window.location.href = '/pricing'
          }
        }
      );
      return false;
    }

    // Warn when close to limit
    if (remaining <= 2 && currentPlan.aiRequestsPerDay !== -1) {
      toast.warning(`Only ${remaining} AI requests remaining today`);
    }

    return true;
  };

  const getPlanInfo = () => {
    if (!currentPlan) return null;

    return {
      name: currentPlan.name,
      maxPlayers: currentPlan.maxPlayers,
      aiRequestsPerDay: currentPlan.aiRequestsPerDay,
      aiRequestsRemaining: getAIRequestsRemaining(),
      isUnlimitedPlayers: currentPlan.maxPlayers === -1,
      isUnlimitedAI: currentPlan.aiRequestsPerDay === -1
    };
  };

  return {
    checkPlayerLimit,
    checkAILimit,
    getPlanInfo,
    currentPlan
  };
};
