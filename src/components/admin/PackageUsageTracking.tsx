// src/components/admin/PackageUsageTracking.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Package, 
  Users, 
  Clock, 
  DollarSign, 
  Search, 
  Filter,
  Eye,
  TrendingUp,
  Calendar,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/apiClient';

interface PackageUsageData {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  packageName: string;
  packageType: string;
  targetRole: string;
  totalPasses: number;
  usedPasses: number;
  activePasses: number;
  expiredPasses: number;
  totalAmount: number;
  purchaseDate: string;
  expiryDate: string;
  isExpired: boolean;
  usagePercentage: number;
}

interface PackageStats {
  totalPurchases: number;
  totalRevenue: number;
  totalActivePasses: number;
  totalUsedPasses: number;
  averageUsageRate: number;
}

export const PackageUsageTracking: React.FC = () => {
  const { toast } = useToast();
  const [packageUsage, setPackageUsage] = useState<PackageUsageData[]>([]);
  const [packageStats, setPackageStats] = useState<PackageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState<PackageUsageData | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch package usage data
  const fetchPackageUsage = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:8000/api';
      
      // Build query parameters
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      
      const queryString = params.toString();
      const url = `${API_BASE_URL}/packages/admin/usage${queryString ? `?${queryString}` : ''}`;
      
      const response = await authenticatedFetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch package usage data');
      }
      
      const data = await response.json();
      setPackageUsage(data.usage || []);
      setPackageStats(data.stats || null);
    } catch (error) {
      console.error('Error fetching package usage:', error);
      toast({
        title: "Error",
        description: "Failed to fetch package usage data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackageUsage();
  }, [debouncedSearchTerm]);

  // Filter data based on type and status (search is handled by backend)
  const filteredData = packageUsage.filter(item => {
    const matchesType = filterType === 'all' || item.packageType === filterType;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && !item.isExpired && item.activePasses > 0) ||
      (filterStatus === 'expired' && item.isExpired) ||
      (filterStatus === 'fully_used' && item.usedPasses === item.totalPasses);
    
    return matchesType && matchesStatus;
  });

  const getUsageColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusBadge = (item: PackageUsageData) => {
    if (item.isExpired) return <Badge variant="destructive">Expired</Badge>;
    if (item.usedPasses === item.totalPasses) return <Badge className="bg-blue-100 text-blue-800">Fully Used</Badge>;
    if (item.activePasses > 0) return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    return <Badge variant="secondary">Inactive</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Package Usage Tracking</h2>
          <p className="text-gray-600">Monitor package purchases and usage across all users</p>
        </div>
        <Button onClick={fetchPackageUsage} variant="outline">
          <Package className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

     
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by user name, email, or package..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Package Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="HALF_DAY">Half Day</SelectItem>
                <SelectItem value="FULL_DAY">Full Day</SelectItem>
                <SelectItem value="SEMESTER_BUNDLE">Semester Bundle</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="fully_used">Fully Used</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Package Usage Table */}
      <Card>
        <CardHeader>
          <CardTitle>Package Usage Details</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Package className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-500" />
                <p className="text-gray-600">Loading package usage data...</p>
              </div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No package usage data found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Packages</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.userName}</div>
                          <div className="text-sm text-gray-500">{item.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{item.packageName}</div>
                        <div className="text-sm text-gray-500">{item.targetRole}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.packageType}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Total: {item.totalPasses}</div>
                          <div className="text-green-600">Used: {item.usedPasses}</div>
                          <div className="text-blue-600">Active: {item.activePasses}</div>
                          <div className="text-gray-500">Expired: {item.expiredPasses}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-orange-500 h-2 rounded-full" 
                              style={{ width: `${item.usagePercentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{item.usagePercentage.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">${item.totalAmount.toFixed(2)}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(item.purchaseDate).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(item)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(item);
                            setShowUserDetails(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Modal */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Package Usage Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-semibold text-lg">{selectedUser.userName}</h4>
                  <p className="text-gray-600">{selectedUser.userEmail}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-600">
                    ${selectedUser.totalAmount.toFixed(2)}
                  </div>
                  <p className="text-sm text-gray-500">Total Spent</p>
                </div>
              </div>

              {/* Package Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                <div>
                  <h4 className="font-semibold">{selectedUser.packageName}</h4>
                  <p className="text-sm text-gray-600">{selectedUser.packageType} • {selectedUser.targetRole}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">
                    {selectedUser.usedPasses} / {selectedUser.totalPasses}
                  </div>
                  <p className="text-sm text-gray-500">Packages Used</p>
                </div>
              </div>

              {/* Usage Breakdown */}
              <div className="space-y-4">
                <h4 className="font-semibold">Usage Breakdown</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{selectedUser.usedPasses}</div>
                    <p className="text-sm text-gray-600">Used</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{selectedUser.activePasses}</div>
                    <p className="text-sm text-gray-600">Active</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">{selectedUser.expiredPasses}</div>
                    <p className="text-sm text-gray-600">Expired</p>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-gray-600">Purchase Date</h4>
                  <p className="text-lg">{new Date(selectedUser.purchaseDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-600">Expiry Date</h4>
                  <p className="text-lg">{new Date(selectedUser.expiryDate).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Usage Progress */}
              <div>
                <h4 className="font-semibold text-sm text-gray-600 mb-2">Usage Progress</h4>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-orange-500 h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${selectedUser.usagePercentage}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedUser.usagePercentage.toFixed(1)}% of packages used
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

