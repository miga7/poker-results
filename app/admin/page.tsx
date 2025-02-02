'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock, Database, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface RefreshStats {
  timestamp: number;
  totalRows: number;
  changedValues: number;
  updatedRows: number;
  isAutomatic: boolean;
}

interface RefreshHistory {
  lastStats: RefreshStats | null;
  history: RefreshStats[];
}

export default function AdminPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshStats, setRefreshStats] = useState<RefreshHistory | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/refresh-data');
      if (response.ok) {
        const data = await response.json();
        if (!data.lastStats) {
          // If no stats exist, trigger an initial refresh
          await refreshData();
        } else {
          setRefreshStats(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch refresh stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const refreshData = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch('/api/refresh-data', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to refresh data');
      }

      const result = await response.json();
      setRefreshStats({
        lastStats: result.stats,
        history: result.history
      });

      toast({
        title: 'Success',
        description: 'Data refreshed successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'medium'
    });
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Refresh</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {refreshStats?.lastStats ? formatDate(refreshStats.lastStats.timestamp) : 'Never'}
            </div>
            <p className="text-xs text-muted-foreground">
              {refreshStats?.lastStats?.isAutomatic ? 'Automatic' : 'Manual'} refresh
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rows</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {refreshStats?.lastStats?.totalRows || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total rows in spreadsheet
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Changed Values</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {refreshStats?.lastStats?.changedValues || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Values changed in last refresh
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Updated Rows</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {refreshStats?.lastStats?.updatedRows || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Updated rows in last refresh
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Refresh Data</h3>
            <p className="text-muted-foreground mb-4">
              Manually refresh data from the spreadsheet. Data is automatically refreshed every day at 5 AM.
            </p>
            <Button
              onClick={refreshData}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Now'}
            </Button>
          </div>

          <div className="mt-8">
            <Button
              variant="outline"
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 mb-4"
            >
              {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Refresh History
            </Button>
            
            {showHistory && (
              <div className="space-y-4">
                {refreshStats?.history.map((stat, index) => (
                  <div
                    key={stat.timestamp}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted"
                  >
                    <div>
                      <p className="font-medium">{formatDate(stat.timestamp)}</p>
                      <p className="text-sm text-muted-foreground">
                        {stat.isAutomatic ? 'Automatic' : 'Manual'} refresh
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        Total: <span className="font-medium">{stat.totalRows}</span>
                      </p>
                      <p className="text-sm">
                        Changed: <span className="font-medium">{stat.changedValues}</span>,
                        Updated: <span className="font-medium">{stat.updatedRows}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 