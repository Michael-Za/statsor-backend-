import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { NotificationProvider, useNotifications } from '../contexts/NotificationContext';
import { toast } from 'sonner';
import NotificationPanel from './NotificationPanel';
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  Calendar, 
  BarChart3, 
  Settings, 
  Database,
  Bot,
  LogOut,
  User,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  Globe,
  Lightbulb,
  Notebook,
  Target,
  Shield,
  Table,
  Play,
  TrendingUp
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { Separator } from './ui/separator';
import { cn } from '../lib/utils';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

const ResponsiveLayoutContent: React.FC<ResponsiveLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t, currentLanguage, setLanguage } = useLanguage();
  const { theme } = useTheme();
  const { unreadCount } = useNotifications();
  const { currentPlan } = useSubscription();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/signin');
      toast.success(t('auth.logoutSuccess'));
    } catch (error) {
      toast.error(t('auth.logoutError'));
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        navigate('/search');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      const actions = JSON.parse(localStorage.getItem('match_actions') || '[]');
      const recentActions = actions.filter((action: any) => {
        const actionTime = new Date(action.timestamp).getTime();
        const now = new Date().getTime();
        return (now - actionTime) < 300000;
      });
      setNotificationCount(recentActions.length);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Mock player data - in a real app, this would come from an API
  const [players] = useState([
    { id: '1', name: 'Fernando Torres', position: 'DEL', number: 9 },
    { id: '2', name: 'Pablo Sánchez', position: 'CEN', number: 8 },
    { id: '3', name: 'Juan Pérez', position: 'DEF', number: 4 },
    { id: '4', name: 'Alejandro Martínez', position: 'POR', number: 1 },
  ]);

  // Show player dropdown when on players page
  // const showPlayerDropdown = location.pathname.startsWith('/players') && !sidebarCollapsed;

  // Check if user has access to premium features
  const isPro = currentPlan && (currentPlan.id === 'pro' || currentPlan.id === 'pro_plus');

  const allNavigationItems = [
    { 
      name: t('sidebar.dashboard'), 
      icon: Home, 
      path: '/dashboard',
      badge: null,
      requiresPro: false
    },
    { 
      name: t('sidebar.players'), 
      icon: Users, 
      path: '/players',
      badge: null,
      requiresPro: false
    },
    { 
      name: t('sidebar.matches'), 
      icon: Calendar, 
      path: '/matches',
      badge: null,
      requiresPro: false
    },
    { 
      name: t('sidebar.stats'), 
      icon: BarChart3, 
      path: '/general-stats',
      badge: null,
      requiresPro: false
    },
    { 
      name: 'Attendance', 
      icon: Users, 
      path: '/attendance',
      badge: null,
      requiresPro: false
    },
    { 
      name: 'Actions', 
      icon: Target, 
      path: '/manual-actions',
      badge: null,
      requiresPro: false
    },
    { 
      name: 'Command Table', 
      icon: Table, 
      path: '/command-table',
      badge: null,
      requiresPro: false
    },
    { 
      name: 'Notepad', 
      icon: Notebook, 
      path: '/analytics',
      badge: null,
      requiresPro: false
    },
    { 
      name: t('sidebar.training'), 
      icon: TrendingUp, 
      path: '/training',
      badge: 'PRO',
      requiresPro: true
    },
    { 
      name: 'Data Management', 
      icon: Database, 
      path: '/data-management',
      badge: null,
      requiresPro: false
    },
    { 
      name: t('sidebar.aiAssistant'), 
      icon: Bot, 
      path: '/ai-assistant',
      badge: 'AI',
      requiresPro: false
    },
    { 
      name: t('sidebar.settings'), 
      icon: Settings, 
      path: '/settings',
      badge: null,
      requiresPro: false
    }
  ];

  // Filter navigation items based on subscription
  const navigationItems = allNavigationItems.filter(item => {
    if (item.requiresPro && !isPro) {
      return false; // Hide premium features from free users
    }
    return true;
  });

  return (
    <div className="min-h-screen pwa-safe-area bg-white text-gray-900">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={cn(
       `fixed top-0 left-0 z-50 h-full transition-all duration-300 ease-in-out scroll-smooth-mobile bg-black border-r border-gray-800`,
       sidebarOpen ? "translate-x-0" : "-translate-x-full",
       sidebarCollapsed ? "w-16" : "w-64",
       "md:translate-x-0"
     )}>
      <div className="flex flex-col h-full">
          <div className={cn(
             "flex items-center justify-between p-4 border-b border-gray-800",
             sidebarCollapsed && "justify-center px-2"
           )}>
            {!sidebarCollapsed && (
              <h1 className="text-xl font-bold text-white truncate">
                Statsor
              </h1>
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden md:flex touch-target focus-enhanced text-white hover:bg-gray-800"
              >
                {sidebarCollapsed ? <ChevronRight size={16} className="text-white" /> : <ChevronLeft size={16} className="text-white" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="md:hidden touch-target focus-enhanced text-white hover:bg-gray-800"
              >
                <X size={20} className="text-white" />
              </Button>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto scroll-smooth-mobile">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <div key={item.path}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 touch-target focus-enhanced transition-all duration-200 text-white hover:bg-gray-800",
                      sidebarCollapsed ? "px-2" : "px-3",
                      isActive && "bg-gray-900 text-white border-l-2 border-white"
                    )}
                    onClick={() => {
                      navigate(item.path);
                      setSidebarOpen(false);
                    }}
                  >
                    <Icon size={18} className="flex-shrink-0 text-white" />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-left text-white">{item.name}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="ml-auto bg-gray-800 text-white">
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </Button>
                  
                  {/* Player dropdown - only show when on players page */}
                  {/* Removed as per user request */}
                </div>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-800">
            <div className={cn(
              "flex items-center gap-3",
              sidebarCollapsed && "justify-center"
            )}>
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-gray-800 text-white">
                  {user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-white">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs truncate text-gray-300">
                    {user?.email}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      <div className={cn(
        "flex flex-col min-h-screen transition-all duration-300 bg-white",
        sidebarCollapsed ? "md:ml-16" : "md:ml-64"
      )}>
        <header className="sticky top-0 z-30 backdrop-blur safe-area-top bg-white/95 supports-[backdrop-filter]:bg-white/90 border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between p-3 sm:p-4 container-responsive">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="md:hidden touch-target focus-enhanced text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              >
                <Menu size={20} />
              </Button>
              
              <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-md lg:max-w-lg">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    type="text"
                    placeholder={t('search.placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 focus-enhanced text-responsive-base bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white focus:border-gray-400"
                  />
                </div>
              </form>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/search')}
                className="sm:hidden touch-target focus-enhanced text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              >
                <Search size={18} />
              </Button>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="touch-target focus-enhanced text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <Globe size={16} />
                    <span className="ml-1 sm:ml-2 hidden sm:inline text-responsive-sm">{currentLanguage.toUpperCase()}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setLanguage('en')}>
                    English
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage('es')}>
                    Español
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setNotificationPanelOpen(!notificationPanelOpen)}
                className="relative touch-target focus-enhanced text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-1 sm:gap-2 touch-target focus-enhanced text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <Avatar className="h-6 w-6 sm:h-7 sm:w-7">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className="text-xs">
                        {user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-responsive-sm truncate max-w-[100px] text-gray-900">{user?.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User size={16} className="mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings size={16} className="mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <Separator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Notification Panel */}
        <NotificationPanel 
          isOpen={notificationPanelOpen} 
          onClose={() => setNotificationPanelOpen(false)} 
        />

        <main className="flex-1 safe-area-bottom scroll-smooth-mobile flex bg-white w-full">
          <div className="flex-1 spacing-responsive py-0 text-gray-900 w-full h-full">
             {children}
           </div>
        </main>
      </div>
    </div>
  );
};

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ children }) => {
  return (
    <NotificationProvider>
      <ResponsiveLayoutContent>{children}</ResponsiveLayoutContent>
    </NotificationProvider>
  );
};

export default ResponsiveLayout;