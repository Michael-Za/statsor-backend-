import React from 'react';
import { ValorantAnalyzer } from '../components/ValorantAnalyzer';

const ValorantAnalysis = () => {
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-900 to-black p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Valorant Match Analysis</h1>
        <ValorantAnalyzer />
      </div>
    </div>
  );
};

export default ValorantAnalysis;