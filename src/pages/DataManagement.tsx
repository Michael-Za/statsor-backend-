import React from 'react';
import { motion } from 'framer-motion';
import { DataManagementSection } from '../components/DataManagementSection';
import { useTheme } from '../contexts/ThemeContext';
import { Database } from 'lucide-react';

const DataManagement: React.FC = () => {
  const { theme, isHighContrast } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6"
    >
      <div className="mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Management</h1>
          <p className={`${
              isHighContrast ? 'hc-text' :
              theme === 'midnight' ? 'text-gray-600' : 'text-gray-600'
            }`}>
            Manage your team data, player information, and club details
          </p>
        </div>
      </div>
      
      <DataManagementSection />
    </motion.div>
  );
};

export default DataManagement;