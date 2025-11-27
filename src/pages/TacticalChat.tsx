import React from 'react';
import { TacticalAIChatbot } from '../components/TacticalAIChatbot';
import { useLanguage } from '../contexts/LanguageContext';

const TacticalChat = () => {
  const { t } = useLanguage();
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('sidebar.tactical.chat')}</h1>
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-600 mb-4">
          The Tactical AI Assistant is available as a floating chat button in the bottom-right corner of your screen.
        </p>
        <p className="text-sm text-gray-500">
          Click the brain icon to start getting tactical advice, formation analysis, and strategic insights!
        </p>
      </div>
    </div>
  );
};

export default TacticalChat;