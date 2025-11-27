import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import PlayerVerification from '../components/PlayerVerification';
import LiveMatchThreads from '../components/LiveMatchThreads';
import SkillSwapMarketplace from '../components/SkillSwapMarketplace';
import ReputationSystem from '../components/ReputationSystem';
import { 
  Shield, 
  MessageCircle, 
  Users, 
  Award,
  Zap,
  TrendingUp
} from 'lucide-react';

const CommunityHub = () => {
  const [activeTab, setActiveTab] = useState('verification');

  return (
    <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Hub</h1>
          <p className="text-gray-600">
            Connect with real players, share skills, and engage in live match discussions
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="verification" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Verification</span>
            </TabsTrigger>
            <TabsTrigger value="match-threads" className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4" />
              <span>Live Threads</span>
            </TabsTrigger>
            <TabsTrigger value="skill-swap" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Skill Swap</span>
            </TabsTrigger>
            <TabsTrigger value="reputation" className="flex items-center space-x-2">
              <Award className="w-4 h-4" />
              <span>Reputation</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="verification" className="mt-6">
            <PlayerVerification />
          </TabsContent>

          <TabsContent value="match-threads" className="mt-6">
            <LiveMatchThreads />
          </TabsContent>

          <TabsContent value="skill-swap" className="mt-6">
            <SkillSwapMarketplace />
          </TabsContent>

          <TabsContent value="reputation" className="mt-6">
            <ReputationSystem />
          </TabsContent>
        </Tabs>
      </div>
  );
};

export default CommunityHub;