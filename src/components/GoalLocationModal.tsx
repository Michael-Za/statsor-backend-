import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { useLanguage } from '../contexts/LanguageContext';

interface GoalLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: string) => void;
}

export const GoalLocationModal: React.FC<GoalLocationModalProps> = ({
  isOpen,
  onClose,
  onLocationSelect
}) => {
  const { t } = useLanguage();

  const goalLocations = [
    { id: 'top-left', label: t('goal.location.top.left'), position: 'top-left' },
    { id: 'top-center', label: t('goal.location.top.center'), position: 'top-center' },
    { id: 'top-right', label: t('goal.location.top.right'), position: 'top-right' },
    { id: 'middle-left', label: t('goal.location.middle.left'), position: 'middle-left' },
    { id: 'middle-center', label: t('goal.location.middle.center'), position: 'middle-center' },
    { id: 'middle-right', label: t('goal.location.middle.right'), position: 'middle-right' },
    { id: 'bottom-left', label: t('goal.location.bottom.left'), position: 'bottom-left' },
    { id: 'bottom-center', label: t('goal.location.bottom.center'), position: 'bottom-center' },
    { id: 'bottom-right', label: t('goal.location.bottom.right'), position: 'bottom-right' },
  ];

  const handleLocationSelect = (location: string) => {
    onLocationSelect(location);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            {t('goal.location.title')}
          </DialogTitle>
          <p className="text-center text-gray-600 text-sm">
            {t('goal.location.subtitle')}
          </p>
        </DialogHeader>

        <div className="p-6">
          {/* Goal Target Visual */}
          <div className="relative mb-6">
            <div className="w-full max-w-xs mx-auto">
              <div className="bg-green-100 border-4 border-green-500 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-2">
                  {goalLocations.map((location) => (
                    <Button
                      key={location.id}
                      onClick={() => handleLocationSelect(location.id)}
                      variant="outline"
                      className="h-16 w-full border-2 border-gray-300 hover:border-primary hover:bg-primary/10 text-xs font-medium"
                    >
                      {location.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="text-center mt-2">
                <span className="text-xs text-gray-500">{t('goal.location.goal.target')}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={onClose}
              variant="outline"
              className="px-6"
            >
              {t('goal.location.cancel')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};