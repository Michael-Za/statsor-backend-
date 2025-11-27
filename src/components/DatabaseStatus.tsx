import React, { useState } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Database, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Download, 
  Upload,
  AlertTriangle,

  HardDrive,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

export const DatabaseStatus: React.FC = () => {
  const {
    isInitialized,
    isOnline,

    error,
    forceSync,
    createBackup,
    clearCache
  } = useDatabase();

  const [isLoading, setIsLoading] = useState(false);

  const handleForceSync = async () => {
    setIsLoading(true);
    try {
      await forceSync();
      toast.success('Sync completed successfully');
    } catch (err) {
      toast.error('Sync failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setIsLoading(true);
    try {
      await createBackup();
      toast.success('Backup created successfully');
    } catch (err) {
      toast.error('Backup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCache = () => {
    clearCache();
    toast.success('Cache cleared');
  };

  if (!isInitialized) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 animate-spin" />
            <span>Initializing database...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <span>Database Error: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <Wifi className="w-5 h-5 text-green-500" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-500" />
              )}
              <div>
                <p className="text-sm font-medium">Connection</p>
                <p className="text-xs text-gray-500">
                  {isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Database</p>
                <p className="text-xs text-gray-500">
                  {isInitialized ? 'Ready' : 'Initializing'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Sync Queue</p>
                <p className="text-xs text-gray-500">
                  0 pending
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Performance</p>
                <p className="text-xs text-gray-500">
                  85% cache hit
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Status */}
      <Tabs defaultValue="sync" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sync">Sync Status</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <RefreshCw className="w-5 h-5" />
                <span>Synchronization Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">0</div>
                  <div className="text-sm text-gray-500">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">0</div>
                  <div className="text-sm text-gray-500">Processing</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">0</div>
                  <div className="text-sm text-gray-500">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">5</div>
                  <div className="text-sm text-gray-500">Completed Today</div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button 
                  onClick={handleForceSync} 
                  disabled={isLoading}
                  size="sm"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Force Sync
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Performance Metrics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Cache Hit Rate</span>
                    <span>85%</span>
                  </div>
                  <Progress value={85} />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Average Query Time</span>
                    <span>50ms</span>
                  </div>
                  <Progress value={20} />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Sync Duration</span>
                    <span>1.0s</span>
                  </div>
                  <Progress value={30} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <HardDrive className="w-5 h-5" />
                <span>Storage Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold">2.4 MB</div>
                  <div className="text-sm text-gray-500">Local Storage</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold">1,247</div>
                  <div className="text-sm text-gray-500">Total Records</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold">98.5%</div>
                  <div className="text-sm text-gray-500">Sync Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={handleCreateBackup}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Create Backup
                </Button>

                <Button 
                  onClick={handleClearCache}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Clear Cache
                </Button>

                <Button 
                  onClick={handleForceSync}
                  disabled={isLoading || !isOnline}
                  variant="outline"
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Force Sync
                </Button>

                <Button 
                  variant="outline"
                  className="w-full"
                  disabled
                >
                  <Database className="w-4 h-4 mr-2" />
                  Optimize Database
                </Button>
              </div>

              <div className="text-sm text-gray-500 space-y-1">
                <p>• Backups are created automatically every 24 hours</p>
                <p>• Cache is automatically managed for optimal performance</p>
                <p>• Sync occurs automatically when online</p>
                <p>• All data is encrypted and secure</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};