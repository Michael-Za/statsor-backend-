import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { ArrowRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ManagementCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'indigo';
  path: string;
  stats: Array<{
    label: string;
    value: string;
  }>;
}

const colorClasses = {
  blue: {
    bg: 'bg-gradient-to-br from-blue-100 to-blue-200',
    darkBg: 'bg-gradient-to-br from-blue-900/80 to-blue-800/60',
    border: 'border-blue-300',
    darkBorder: 'border-blue-600/70',
    text: 'text-blue-700',
    darkText: 'text-blue-200',
    icon: 'text-blue-600',
    darkIcon: 'text-blue-300'
  },
  green: {
    bg: 'bg-gradient-to-br from-green-100 to-green-200',
    darkBg: 'bg-gradient-to-br from-green-900/80 to-green-800/60',
    border: 'border-green-300',
    darkBorder: 'border-green-600/70',
    text: 'text-green-700',
    darkText: 'text-green-200',
    icon: 'text-green-600',
    darkIcon: 'text-green-300'
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-100 to-purple-200',
    darkBg: 'bg-gradient-to-br from-purple-900/80 to-purple-800/60',
    border: 'border-purple-300',
    darkBorder: 'border-purple-600/70',
    text: 'text-purple-700',
    darkText: 'text-purple-200',
    icon: 'text-purple-600',
    darkIcon: 'text-purple-300'
  },
  orange: {
    bg: 'bg-gradient-to-br from-orange-100 to-orange-200',
    darkBg: 'bg-gradient-to-br from-orange-900/80 to-orange-800/60',
    border: 'border-orange-300',
    darkBorder: 'border-orange-600/70',
    text: 'text-orange-700',
    darkText: 'text-orange-200',
    icon: 'text-orange-600',
    darkIcon: 'text-orange-300'
  },
  indigo: {
    bg: 'bg-gradient-to-br from-indigo-100 to-indigo-200',
    darkBg: 'bg-gradient-to-br from-indigo-900/80 to-indigo-800/60',
    border: 'border-indigo-300',
    darkBorder: 'border-indigo-600/70',
    text: 'text-indigo-700',
    darkText: 'text-indigo-200',
    icon: 'text-indigo-600',
    darkIcon: 'text-indigo-300'
  }
};

export const ManagementCard: React.FC<ManagementCardProps> = ({
  title,
  description,
  icon,
  color,
  path,
  stats
}) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const colors = colorClasses[color];
  const isDark = theme === 'dark' || theme === 'midnight' || theme === 'ocean' || theme === 'forest';

  const handleClick = () => {
    // Handle navigation to data-section properly
    if (path === '#data-section') {
      const element = document.getElementById('data-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(path);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        scale: 1.05,
        transition: { 
          type: "spring", 
          stiffness: 300, 
          damping: 20,
          duration: 0.2
        }
      }}
      whileTap={{ scale: 0.98 }}
      className="cursor-pointer"
      onClick={handleClick}
    >
      <Card className={`
        ${isDark ? colors.darkBg : colors.bg}
        ${isDark ? colors.darkBorder : colors.border}
        border-2 transition-all duration-300 ease-out
        shadow-lg hover:shadow-xl
        ${isDark ? 'hover:shadow-white/20' : 'hover:shadow-gray-500/40'}
        rounded-xl overflow-hidden backdrop-blur-sm
      `}>
        <CardContent className="p-8">
          {/* Header section */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className={`
                p-4 rounded-xl transition-all duration-200
                ${isDark ? 'bg-white/20 border border-white/30' : 'bg-white/80 border border-white/50'}
                shadow-md
              `}>
                <div className={isDark ? colors.darkIcon : colors.icon}>
                  {icon}
                </div>
              </div>
              <div>
                <h3 className={`
                  font-bold text-xl mb-2 transition-colors duration-200
                  ${isDark ? 'text-white drop-shadow-sm' : 'text-gray-900'}
                `}>
                  {title}
                </h3>
                <p className={`
                  text-base leading-relaxed font-medium
                  ${isDark ? 'text-gray-200 drop-shadow-sm' : 'text-gray-700'}
                `}>
                  {description}
                </p>
              </div>
            </div>
            
            {/* Arrow */}
            <motion.div
              whileHover={{ x: 4 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <ArrowRight className={`
                h-7 w-7 transition-colors duration-200 font-bold
                ${isDark ? colors.darkText : colors.text}
              `} />
            </motion.div>
          </div>
          
          {/* Stats section */}
          <div className="space-y-4">
            {stats.map((stat, index) => (
              <motion.div 
                key={index} 
                className={`
                  flex justify-between items-center p-4 rounded-lg
                  transition-all duration-200
                  ${isDark ? 'bg-white/15 hover:bg-white/25 border border-white/20' : 'bg-white/70 hover:bg-white/90 border border-white/40'}
                  shadow-sm
                `}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <span className={`
                  text-base font-semibold
                  ${isDark ? 'text-gray-100' : 'text-gray-800'}
                `}>
                  {stat.label}
                </span>
                <span className={`
                  text-base font-bold px-4 py-2 rounded-md shadow-sm
                  ${isDark ? colors.darkText : colors.text}
                  ${isDark ? 'bg-white/20 border border-white/30' : 'bg-white/80 border border-white/50'}
                  transition-all duration-200
                `}>
                  {stat.value}
                </span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};