import React from 'react';
import { DatabaseStatus } from '../components/DatabaseStatus';
import { useLanguage } from '../contexts/LanguageContext';

const DatabaseStatusPage = () => {
  const { t } = useLanguage();
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('sidebar.database.status')}</h1>
      <DatabaseStatus />
    </div>
  );
};

export default DatabaseStatusPage;