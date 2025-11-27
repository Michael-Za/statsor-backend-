import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Lightbulb,
  Target,
  Heart,
  TrendingUp,
  MapPin,
  Users,
  Clock,
  Trophy,
  Activity,
  Brain,
  Zap,
  Shield,
  ArrowLeft,
  ChevronRight,
  Star,
  BookOpen,
  Dumbbell,
  Apple
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const Suggestions = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('tactical');

  const suggestionCategories = [
    {
      id: 'tactical',
      name: 'Tactical Ideas',
      icon: Target,
      color: 'bg-blue-500',
      description: 'Strategic formations and game plans'
    },
    {
      id: 'training',
      name: 'Training Plans',
      icon: Dumbbell,
      color: 'bg-green-500',
      description: 'Effective training methodologies'
    },
    {
      id: 'health',
      name: 'Health & Wellness',
      icon: Heart,
      color: 'bg-red-500',
      description: 'Player health and injury prevention'
    },
    {
      id: 'performance',
      name: 'Performance Tips',
      icon: TrendingUp,
      color: 'bg-purple-500',
      description: 'Maximize team and individual results'
    }
  ];

  const tacticalSuggestions = [
    {
      title: '4-3-3 Formation Mastery',
      description: 'Optimize your attacking play with proper wing positioning and midfield control.',
      icon: Target,
      priority: 'High',
      estimatedTime: '2 weeks',
      tips: [
        'Focus on wide play and crossing opportunities',
        'Maintain midfield triangle for ball circulation',
        'Use inverted wingers for cutting inside',
        'Press high with coordinated front three'
      ]
    },
    {
      title: 'Defensive Pressing System',
      description: 'Implement a coordinated pressing system to win the ball back quickly.',
      icon: Shield,
      priority: 'Medium',
      estimatedTime: '3 weeks',
      tips: [
        'Set pressing triggers (bad first touch, back pass)',
        'Coordinate pressing with defensive line',
        'Practice counter-pressing after losing possession',
        'Use body positioning to force play direction'
      ]
    },
    {
      title: 'Set Piece Variations',
      description: 'Develop creative set piece routines to surprise opponents.',
      icon: Brain,
      priority: 'Medium',
      estimatedTime: '1 week',
      tips: [
        'Create 3-4 corner kick variations',
        'Practice short free kick combinations',
        'Use decoy runs to create space',
        'Assign specific roles for each player'
      ]
    }
  ];

  const trainingSuggestions = [
    {
      title: 'High-Intensity Interval Training',
      description: 'Improve match fitness with sport-specific conditioning.',
      icon: Zap,
      priority: 'High',
      estimatedTime: '4 weeks',
      tips: [
        'Use ball work during high-intensity periods',
        'Match work-to-rest ratios of actual game',
        'Include direction changes and acceleration',
        'Monitor heart rate zones during training'
      ]
    },
    {
      title: 'Technical Skills Circuit',
      description: 'Develop individual technical abilities through focused drills.',
      icon: Activity,
      priority: 'High',
      estimatedTime: 'Ongoing',
      tips: [
        'Focus on first touch and ball control',
        'Practice passing with both feet',
        'Include 1v1 situations regularly',
        'Work on shooting from various angles'
      ]
    },
    {
      title: 'Small-Sided Games',
      description: 'Enhance decision-making and game understanding.',
      icon: Users,
      priority: 'Medium',
      estimatedTime: 'Weekly',
      tips: [
        'Use different field sizes for various objectives',
        'Implement specific rules to encourage behaviors',
        'Rotate teams to challenge different players',
        'Focus on quick transitions and pressing'
      ]
    }
  ];

  const healthSuggestions = [
    {
      title: 'Injury Prevention Protocol',
      description: 'Reduce injury risk through proper warm-up and strengthening.',
      icon: Shield,
      priority: 'High',
      estimatedTime: 'Daily',
      tips: [
        'Dynamic warm-up before every session',
        'Focus on ankle, knee, and hip stability',
        'Include eccentric strengthening exercises',
        'Monitor training load and recovery'
      ]
    },
    {
      title: 'Nutrition Guidelines',
      description: 'Optimize performance through proper nutrition and hydration.',
      icon: Apple,
      priority: 'High',
      estimatedTime: 'Ongoing',
      tips: [
        'Pre-match meal 3-4 hours before kickoff',
        'Hydrate consistently throughout the day',
        'Post-training recovery nutrition within 30 minutes',
        'Educate players on supplement safety'
      ]
    },
    {
      title: 'Recovery Strategies',
      description: 'Implement effective recovery methods for optimal performance.',
      icon: Clock,
      priority: 'Medium',
      estimatedTime: 'Daily',
      tips: [
        'Prioritize 7-9 hours of quality sleep',
        'Use active recovery on rest days',
        'Implement stretching and mobility routines',
        'Monitor stress levels and mental health'
      ]
    }
  ];

  const performanceSuggestions = [
    {
      title: 'Goal Setting Framework',
      description: 'Set SMART goals for individual and team development.',
      icon: Trophy,
      priority: 'High',
      estimatedTime: '1 week',
      tips: [
        'Set specific, measurable objectives',
        'Create short-term and long-term goals',
        'Regular progress reviews with players',
        'Celebrate achievements and milestones'
      ]
    },
    {
      title: 'Mental Preparation',
      description: 'Develop mental toughness and concentration skills.',
      icon: Brain,
      priority: 'Medium',
      estimatedTime: 'Ongoing',
      tips: [
        'Practice visualization techniques',
        'Develop pre-match routines',
        'Work on concentration and focus drills',
        'Build confidence through positive reinforcement'
      ]
    },
    {
      title: 'Team Communication',
      description: 'Improve on-field communication and leadership.',
      icon: Users,
      priority: 'Medium',
      estimatedTime: '2 weeks',
      tips: [
        'Establish clear communication signals',
        'Develop leadership roles within the team',
        'Practice calling plays and organizing defense',
        'Encourage positive communication during matches'
      ]
    }
  ];

  const getSuggestionsByCategory = (category: string) => {
    switch (category) {
      case 'tactical':
        return tacticalSuggestions;
      case 'training':
        return trainingSuggestions;
      case 'health':
        return healthSuggestions;
      case 'performance':
        return performanceSuggestions;
      default:
        return tacticalSuggestions;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={`min-h-screen p-6 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 hover:bg-white/10 backdrop-blur-sm"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Button>
        </div>
        
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 mb-4 shadow-lg"
          >
            <Lightbulb className="w-8 h-8 text-white" />
          </motion.div>
          
          <h1 className={`text-4xl font-bold mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Team Suggestions
          </h1>
          
          <p className={`text-lg ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Expert recommendations to maximize your team's potential
          </p>
        </div>
      </motion.div>

      {/* Category Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {suggestionCategories.map((category, index) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;
            
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card
                  className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                    isSelected
                      ? 'ring-2 ring-blue-500 shadow-lg'
                      : 'hover:shadow-md'
                  } ${
                    theme === 'dark'
                      ? 'bg-gray-800/50 border-gray-700 backdrop-blur-sm'
                      : 'bg-white/80 backdrop-blur-sm'
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <CardContent className="p-6 text-center">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${category.color} mb-3`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className={`font-semibold mb-2 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {category.name}
                    </h3>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {category.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Suggestions List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="space-y-6"
      >
        {getSuggestionsByCategory(selectedCategory).map((suggestion, index) => {
          const Icon = suggestion.icon;
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className={`${
                theme === 'dark'
                  ? 'bg-gray-800/50 border-gray-700 backdrop-blur-sm'
                  : 'bg-white/80 backdrop-blur-sm'
              } hover:shadow-lg transition-all duration-300`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className={`text-xl ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {suggestion.title}
                        </CardTitle>
                        <CardDescription className={`mt-1 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {suggestion.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge className={getPriorityColor(suggestion.priority)}>
                        {suggestion.priority} Priority
                      </Badge>
                      <Badge variant="outline" className={`${
                        theme === 'dark' ? 'border-gray-600 text-gray-300' : ''
                      }`}>
                        <Clock className="w-3 h-3 mr-1" />
                        {suggestion.estimatedTime}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <h4 className={`font-semibold flex items-center gap-2 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      <Star className="w-4 h-4 text-yellow-500" />
                      Key Implementation Tips:
                    </h4>
                    <ul className="space-y-2">
                      {suggestion.tips.map((tip, tipIndex) => (
                        <li
                          key={tipIndex}
                          className={`flex items-start gap-3 ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}
                        >
                          <ChevronRight className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-12 text-center"
      >
        <Card className={`${
          theme === 'dark'
            ? 'bg-gradient-to-r from-gray-800/50 to-gray-700/50 border-gray-600'
            : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'
        } backdrop-blur-sm`}>
          <CardContent className="p-8">
            <h3 className={`text-2xl font-bold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Ready to implement these suggestions?
            </h3>
            <p className={`mb-6 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Start with high-priority items and track your team's progress
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={() => navigate('/training')}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              >
                <Dumbbell className="w-4 h-4 mr-2" />
                Plan Training Session
              </Button>
              <Button
                onClick={() => navigate('/analytics')}
                variant="outline"
                className={`${
                  theme === 'dark'
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Suggestions;