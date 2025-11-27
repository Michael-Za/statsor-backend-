import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from './ui/card';
import { useTheme } from '../contexts/ThemeContext';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  trend?: number;
  delay?: number;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  bgColor,
  trend,
  delay = 0
}) => {
  const { theme, isHighContrast } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.6, ease: "easeOut" }}
      whileHover={{ y: -2, scale: 1.02 }}
      className="h-full"
    >
      <Card className={`h-full transition-all duration-300 hover:shadow-lg ${
        isHighContrast ? 'hc-card' :
        theme === 'dark' 
          ? 'bg-gray-800/90 border-2 border-gray-700 hover:border-gray-600' 
          : 'bg-white/90 border-2 border-gray-200 hover:border-gray-300'
      }`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className={`text-sm font-medium mb-1 ${
                isHighContrast ? 'text-black' :
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {title}
              </p>
              <p className={`text-2xl font-bold mb-1 ${
                isHighContrast ? 'text-black' : ''
              }`}>{value}</p>
              {subtitle && (
                <p className={`text-xs ${
                  isHighContrast ? 'text-black opacity-70' :
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  {subtitle}
                </p>
              )}
              {trend !== undefined && (
                <div className={`text-xs mt-2 flex items-center ${
                  isHighContrast ? 'text-black' :
                  trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-gray-500'
                }`}>
                  {trend > 0 ? '↗' : trend < 0 ? '↘' : '→'} {Math.abs(trend)}%
                </div>
              )}
            </div>
            <motion.div 
              className={`p-3 rounded-xl shadow-lg ${
                isHighContrast ? 'bg-black border-2 border-black' : bgColor
              }`}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ duration: 0.2 }}
            >
              <Icon className={`w-6 h-6 ${
                isHighContrast ? 'text-white' : color
              }`} />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};