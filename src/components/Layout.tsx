import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './ui/button';

import { 
  Home, 
  Users, 
  BarChart3, 
  Calendar, 
  ClipboardCheck,
  FileText,
  Activity,
  Database,
  Dumbbell,
  Trophy,
  CheckCircle,
  Edit3,
  Sliders,
  MessageCircle,
  TrendingUp,
  Users as UsersIcon,
  Menu,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sidebarItems = [
    { path: '/dashboard', icon: Home, label: t('sidebar.home') },
    { path: '/players', icon: Users, label: t('sidebar.players') },
    { path: '/training', icon: Dumbbell, label: t('sidebar.trainings') },
    { path: '/matches', icon: Trophy, label: t('sidebar.matches') },
    { path: '/general-stats', icon: BarChart3, label: t('sidebar.general.stats') },
    { path: '/attendance', icon: CheckCircle, label: t('sidebar.attendance') },
    { path: '/manual-actions', icon: Edit3, label: t('sidebar.manual.actions') },
    { path: '/command-table', icon: Sliders, label: t('sidebar.command.table') },
    { path: '/tactical-chat', icon: MessageCircle, label: t('sidebar.tactical.chat') },
    { path: '/advanced-analytics', icon: TrendingUp, label: t('sidebar.advanced.analytics') },
    { path: '/community', icon: UsersIcon, label: 'Community Hub' },
    { path: '/database-status', icon: Database, label: t('sidebar.database.status') },
  ];

  const handleSignOut = async () => {
    await signOut();
  };
  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-gradient-to-b from-gray-800 to-gray-900 text-white shadow-xl transition-all duration-300 fixed h-full z-30`}>
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img 
                src="/lovable-uploads/01b5bf86-f2e7-42cd-9465-4d0bb347d2ea.png" 
                alt="Statsor" 
                className="h-8 w-auto"
              />
              {!isCollapsed && <span className="font-bold">Statsor</span>}
            </div>
            <Button
              onClick={() => setIsCollapsed(!isCollapsed)}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-gray-700 p-1"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        <nav className="p-4">
          <div className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} p-3 rounded-lg transition-all transform hover:scale-105 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={`${isCollapsed ? 'w-10 h-10' : 'w-5 h-5'}`} />
                  {!isCollapsed && <span className="text-sm">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${isCollapsed ? 'ml-16' : 'ml-64'} transition-all duration-300`}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex justify-between items-center px-6 py-4">
            <h1 className="text-xl font-semibold text-gray-900">
              {t('dashboard.welcome')} {user?.name ? `, ${user.name}` : ''}
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user?.email}</span>
              <Button 
                onClick={handleSignOut} 
                variant="outline" 
                size="sm"
                className="hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
              >
                {t('nav.logout')}
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;