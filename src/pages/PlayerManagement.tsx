import React from 'react';
import { motion } from 'framer-motion';
import { PlayerManagementSection } from '../components/PlayerManagementSection';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Users, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const PlayerManagement: React.FC = () => {
  const navigate = useNavigate();
  const { theme, isHighContrast } = useTheme();

  return (
    <div className={`min-h-screen ${
      isHighContrast ? 'hc-bg' :
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-500 rounded-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className={`text-3xl font-bold ${
                    isHighContrast ? 'hc-text' :
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Player Management
                  </h1>
                  <p className={`text-lg ${
                    isHighContrast ? 'hc-text-secondary' :
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Manage your team roster, performance, and fitness data
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className={`${
            isHighContrast ? 'hc-card' :
            theme === 'dark' ? 'bg-white border-gray-200' : 'bg-white border-gray-200'
          }`}>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">25</div>
              <div className="text-sm text-gray-600">Total Players</div>
            </CardContent>
          </Card>
          
          <Card className={`${
            isHighContrast ? 'hc-card' :
            theme === 'dark' ? 'bg-white border-gray-200' : 'bg-white border-gray-200'
          }`}>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">18</div>
              <div className="text-sm text-gray-600">Available</div>
            </CardContent>
          </Card>
          
          <Card className={`${
            isHighContrast ? 'hc-card' :
            theme === 'dark' ? 'bg-white border-gray-200' : 'bg-white border-gray-200'
          }`}>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">3</div>
              <div className="text-sm text-gray-600">Injured</div>
            </CardContent>
          </Card>
          
          <Card className={`${
            isHighContrast ? 'hc-card' :
            theme === 'dark' ? 'bg-white border-gray-200' : 'bg-white border-gray-200'
          }`}>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">4</div>
              <div className="text-sm text-gray-600">Suspended</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Player Management Section */}
        <PlayerManagementSection />
      </div>
    </div>
  );
};

export default PlayerManagement;