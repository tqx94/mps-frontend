'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Package, Users, Calendar, TrendingUp, Search, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { authenticatedFetch } from '@/lib/apiClient'
import { formatSingaporeDateOnly } from '@/lib/timezoneUtils'

interface PackageUsage {
  id: string
  packageName: string
  packageType: string
  targetRole: string
  userName: string
  userEmail: string
  userMemberType: string
  totalPasses: number
  usedPasses: number
  remainingPasses: number
  usagePercentage: number
  revenue: number
  lastUsed: string
  purchasedAt: string
  activatedAt: string
  expiresAt: string
  quantity: number
  paymentMethod: string
}

interface PackageUsageStats {
  totalPackages: number
  totalPurchases: number
  totalPasses: number
  totalUsed: number
  totalRevenue: number
  averageUsage: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function PackageUsageTable() {
  const { toast } = useToast()
  const [packageUsages, setPackageUsages] = useState<PackageUsage[]>([])
  const [stats, setStats] = useState<PackageUsageStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('usagePercentage')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  const fetchPackageUsage = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: debouncedSearch,
        filterType: filterType,
        sortBy: sortBy,
        sortOrder: sortOrder
      })
      
      const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/admin/packages/usage?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch package usage data')
      }
      
      const data = await response.json()
      setPackageUsages(data.packages || [])
      setStats(data.stats || null)
      if (data.pagination) {
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching package usage:', error)
      toast({
        title: "Error",
        description: "Failed to fetch package usage data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  const handleLimitChange = (newLimit: number) => {
    setPagination(prev => ({
      ...prev,
      limit: newLimit,
      page: 1 // Reset to first page when limit changes
    }))
  }

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [searchInput])

  // Update pagination when debounced search changes
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [debouncedSearch])

  useEffect(() => {
    fetchPackageUsage()
  }, [pagination.page, pagination.limit, debouncedSearch, filterType, sortBy, sortOrder])

  // Backend handles filtering and sorting, so we use packages directly
  const filteredPackages = packageUsages

  const getPackageTypeIcon = (type: string) => {
    switch (type) {
      case 'HALF_DAY': return '🕐'
      case 'FULL_DAY': return '🕘'
      case 'SEMESTER_BUNDLE': return '🎓'
      default: return '📦'
    }
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              {isLoading ? (
                <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin" />
              ) : (
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              )}
              <Input
                placeholder="Search packages, user name or email"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="HALF_DAY">Half Day</SelectItem>
                <SelectItem value="FULL_DAY">Full Day</SelectItem>
                <SelectItem value="SEMESTER_BUNDLE">Semester Bundle</SelectItem>
              </SelectContent>
            </Select>
            
            {/* <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usagePercentage">Usage %</SelectItem>
                <SelectItem value="usedPasses">Used Packages</SelectItem>
                <SelectItem value="remainingPasses">Remaining Packages</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="packageName">Package Name</SelectItem>
                <SelectItem value="userName">User Name</SelectItem>
                <SelectItem value="purchasedAt">Purchase Date</SelectItem>
              </SelectContent>
            </Select> */}
            
            {/* <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="w-full sm:w-auto"
            >
              <Filter className="h-4 w-4 mr-2" />
              {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </Button> */}
          </div>
        </CardContent>
      </Card>

      {/* Package Usage Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Package Usage Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading package usage data...</p>
            </div>
          ) : filteredPackages.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No package usage data found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Package</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Total Packages</TableHead>
                    <TableHead>Used</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Usage %</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Purchased</TableHead>
                    <TableHead>Expires</TableHead>
              
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPackages.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getPackageTypeIcon(pkg.packageType)}</span>
                          <div>
                            <p className="font-medium">{pkg.packageName}</p>
                            <p className="text-sm text-gray-500">Purchase ID: {pkg.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <p className="font-medium">{pkg.userName}</p>
                          <p className="text-sm text-gray-500">{pkg.userEmail}</p>
                          <Badge variant="outline" className="text-xs">
                            {pkg.userMemberType}
                          </Badge>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline">
                          {pkg.packageType.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="text-center font-medium">
                        {pkg.totalPasses}
                      </TableCell>
                      
                      <TableCell className="text-center text-green-600 font-medium">
                        {pkg.usedPasses}
                      </TableCell>
                      
                      <TableCell className="text-center text-blue-600 font-medium">
                        {pkg.remainingPasses}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(pkg.usagePercentage, 100)}%` }}
                            ></div>
                          </div>
                          <span className={`text-sm font-medium ${getUsageColor(pkg.usagePercentage)}`}>
                            {pkg.usagePercentage.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right font-medium">
                        ${pkg.revenue.toFixed(2)}
                      </TableCell>
                      
                      <TableCell className="text-sm text-gray-500">
                        {pkg.purchasedAt ? new Date(pkg.purchasedAt).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      
                      <TableCell className="text-sm text-gray-500">
                        {pkg.expiresAt ? new Date(pkg.expiresAt).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      
                 
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} packages
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Rows per page:</span>
                  <Select value={pagination.limit.toString()} onValueChange={(value) => handleLimitChange(parseInt(value))}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.page === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum: number
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i
                      } else {
                        pageNum = pagination.page - 2 + i
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={pagination.page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
