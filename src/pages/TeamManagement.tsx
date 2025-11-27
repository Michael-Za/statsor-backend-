import React from 'react';
import { motion } from 'framer-motion';
import { TeamManagementSection } from '../components/TeamManagementSection';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Users, ArrowLeft, Settings, Trophy, Target, Shield } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const TeamManagement: React.FC = () => {
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
                <div className="p-3 bg-purple-500 rounded-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className={`text-3xl font-bold ${
                    isHighContrast ? 'hc-text' :
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Team Management
                  </h1>
                  <p className={`text-lg ${
                    isHighContrast ? 'hc-text-secondary' :
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Manage team information, formations, tactics, and achievements
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Team Overview Cards */}
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
              <Settings className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 mb-1">4-3-3</div>
              <div className="text-sm text-gray-600">Active Formation</div>
            </CardContent>
          </Card>
          
          <Card className={`${
            isHighContrast ? 'hc-card' :
            theme === 'dark' ? 'bg-white border-gray-200' : 'bg-white border-gray-200'
          }`}>
            <CardContent className="p-6 text-center">
              <Target className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 mb-1">High</div>
              <div className="text-sm text-gray-600">Pressing Intensity</div>
            </CardContent>
          </Card>
          
          <Card className={`${
            isHighContrast ? 'hc-card' :
            theme === 'dark' ? 'bg-white border-gray-200' : 'bg-white border-gray-200'
          }`}>
            <CardContent className="p-6 text-center">
              <Shield className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 mb-1">Medium</div>
              <div className="text-sm text-gray-600">Defensive Line</div>
            </CardContent>
          </Card>
          
          <Card className={`${
            isHighContrast ? 'hc-card' :
            theme === 'dark' ? 'bg-white border-gray-200' : 'bg-white border-gray-200'
          }`}>
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 mb-1">8</div>
              <div className="text-sm text-gray-600">Total Trophies</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Team Info Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className={`${
            isHighContrast ? 'hc-card' :
            theme === 'dark' ? 'bg-white border-gray-200' : 'bg-white border-gray-200'
          } bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200`}>
            <CardHeader>
              <CardTitle className="text-center text-2xl flex items-center justify-center">
                <Users className="h-6 w-6 mr-2" />
                CD Statsor - Team Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-lg font-semibold text-gray-900 mb-1">Founded</div>
                  <div className="text-2xl font-bold text-purple-600">1985</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900 mb-1">Stadium</div>
                  <div className="text-2xl font-bold text-blue-600">Estadio Municipal</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900 mb-1">Capacity</div>
                  <div className="text-2xl font-bold text-green-600">15,000</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Team Management Section */}
        <TeamManagementSection />
      </div>
    </div>
  );
};

export default TeamManagement;