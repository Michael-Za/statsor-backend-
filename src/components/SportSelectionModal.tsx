import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { useSport } from '../contexts/SportContext';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'sonner';

interface SportSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SportSelectionModal: React.FC<SportSelectionModalProps> = ({ isOpen, onClose }) => {
  const [selectedSport, setSelectedSport] = useState<'soccer' | 'futsal' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, updateSportPreference } = useAuth();
  const { setSport, completeSportSelection } = useSport();
  const { t } = useLanguage();

  const handleSportSelection = async () => {
    if (!selectedSport || !user) {
      toast.error('Please select a sport');
      return;
    }

    setIsLoading(true);
    
    try {
      // Update sport preference in auth context
      const { error } = await updateSportPreference(selectedSport);
      
      if (error) {
        throw new Error(error);
      }

      // Update sport context
      setSport(selectedSport);
      completeSportSelection();
      
      toast.success(`${selectedSport === 'soccer' ? 'Football' : 'Futsal'} selected successfully!`);
      onClose();
      
    } catch (error) {
      console.error('Sport selection error:', error);
      toast.error('Failed to save sport preference. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const sports = [
    {
      id: 'soccer' as const,
      name: t('sport.soccer'),
      description: t('sport.soccer.description'),
      features: [
        t('sport.soccer.feature1'),
        t('sport.soccer.feature2'),
        t('sport.soccer.feature3'),
        t('sport.soccer.feature4')
      ],
      icon: '⚽',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'futsal' as const,
      name: t('sport.futsal'),
      description: t('sport.futsal.description'),
      features: [
        t('sport.futsal.feature1'),
        t('sport.futsal.feature2'),
        t('sport.futsal.feature3'),
        t('sport.futsal.feature4')
      ],
      icon: '🏟️',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {t('sport.selection.title')}
            </h2>
            <p className="text-lg text-gray-600">
              {t('sport.selection.subtitle')}
            </p>
            {user && (
              <p className="text-md text-gray-500 mt-2">
                Welcome back, <span className="font-semibold">{user.name}</span>!
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {sports.map((sport, index) => (
              <motion.div
                key={sport.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${
                    selectedSport === sport.id
                      ? `ring-4 ring-primary shadow-xl ${sport.bgColor} ${sport.borderColor} border-2`
                      : 'hover:scale-[1.02] border-gray-200'
                  }`}
                  onClick={() => setSelectedSport(sport.id)}
                >
                  <CardContent className="p-6">
                    <div className="text-center mb-6">
                      <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br ${sport.color} flex items-center justify-center text-3xl shadow-lg`}>
                        {sport.icon}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {sport.name}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {sport.description}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {sport.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-start space-x-3">
                          <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${sport.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                            <span className="text-white text-xs">✓</span>
                          </div>
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {selectedSport === sport.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20"
                      >
                        <p className="text-sm text-primary font-medium text-center">
                          {t('sport.selection.selected')}
                        </p>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleSportSelection}
              disabled={!selectedSport || isLoading}
              className="px-8 py-3 text-base font-semibold bg-primary hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                t('sport.selection.confirm')
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={onClose}
              className="px-8 py-3 text-base font-semibold"
            >
              {t('sport.selection.cancel')}
            </Button>
          </div>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              Don't worry, you can change this later in your settings
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};