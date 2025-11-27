import React from 'react';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { useLanguage } from '../contexts/LanguageContext';

const AdvancedAnalytics = () => {
  const { t } = useLanguage();
  
  return (
    <div className="p-6">
      <AnalyticsDashboard />
    </div>
  );
};

export default AdvancedAnalytics;