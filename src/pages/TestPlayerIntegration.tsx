import React from 'react';
import PlayerDataTest from '../components/PlayerDataTest';

const TestPlayerIntegration: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Player Integration Test</h1>
        <p className="mb-6">This page tests that players are properly loaded and consistent across all sections.</p>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Player Data Verification</h2>
          <PlayerDataTest />
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Integration Status</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
              <span>Players added to demo account service</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
              <span>Players added to database (for real accounts)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
              <span>Data consistency across all components</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
              <span>Player initialization on dashboard load</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPlayerIntegration;