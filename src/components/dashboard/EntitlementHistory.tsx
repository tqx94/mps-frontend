// src/components/dashboard/EntitlementHistory.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { 
  Ticket, 
  Package, 
  Clock, 
  Calendar,
  TrendingDown,
  CheckCircle,
  XCircle,
  Gift
} from 'lucide-react'

// Types matching your EntitlementTabs component
export type UsedPackage = {
  id: string
  name: string
  total_passes: number
  passes_used: number
  purchased_at: string
  expires_at: string
  package_type: 'full-day' | 'half-day' | 'study-hour'
  is_expired: boolean
  final_status: 'fully_used' | 'expired_with_remaining' | 'active'
  booking_references: string[] // Which bookings used this package
}

export type UsedVoucher = {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed_amount'
  discount_value: number
  description: string
  used_at: string
  booking_reference: string
  original_amount: number
  discount_amount: number
  final_amount: number
}

// Mock data for demonstration
const mockUsedVouchers: UsedVoucher[] = [
  {
    id: 'voucher_1',
    code: 'SAVE20',
    discount_type: 'percentage',
    discount_value: 20,
    description: '20% off your booking',
    used_at: '2024-12-20T14:30:00Z',
    booking_reference: 'BK001240',
    original_amount: 50.00,
    discount_amount: 10.00,
    final_amount: 40.00
  },
  {
    id: 'voucher_2',
    code: 'GET15OFF',
    discount_type: 'fixed_amount',
    discount_value: 15,
    description: '$15 off your booking',
    used_at: '2024-11-15T10:00:00Z',
    booking_reference: 'BK001235',
    original_amount: 30.00,
    discount_amount: 15.00,
    final_amount: 15.00
  },
  {
    id: 'voucher_3',
    code: 'SAVE30',
    discount_type: 'percentage',
    discount_value: 30,
    description: '30% off your booking',
    used_at: '2024-10-05T16:45:00Z',
    booking_reference: 'BK001230',
    original_amount: 75.00,
    discount_amount: 22.50,
    final_amount: 52.50
  }
]

const mockUsedPackages: UsedPackage[] = [
  {
    id: 'pkg_used_1',
    name: '10-Day Pass',
    total_passes: 10,
    passes_used: 10,
    purchased_at: '2024-11-01T00:00:00Z',
    expires_at: '2024-12-01T23:59:59Z',
    package_type: 'full-day',
    is_expired: true,
    final_status: 'fully_used',
    booking_references: ['BK001220', 'BK001225', 'BK001228', 'BK001230', 'BK001232', 'BK001234', 'BK001236', 'BK001238', 'BK001240', 'BK001242']
  },
  {
    id: 'pkg_used_2',
    name: '8-Half-Day Pass',
    total_passes: 8,
    passes_used: 5,
    purchased_at: '2024-12-01T00:00:00Z',
    expires_at: '2024-12-31T23:59:59Z',
    package_type: 'half-day',
    is_expired: true,
    final_status: 'expired_with_remaining',
    booking_references: ['BK001244', 'BK001246', 'BK001248', 'BK001250', 'BK001252']
  },
  {
    id: 'pkg_used_3',
    name: 'Student Semester Bundle',
    total_passes: 20,
    passes_used: 20,
    purchased_at: '2024-09-01T00:00:00Z',
    expires_at: '2024-11-30T23:59:59Z',
    package_type: 'study-hour',
    is_expired: true,
    final_status: 'fully_used',
    booking_references: ['BK001200', 'BK001202', 'BK001204', 'BK001206', 'BK001208', 'BK001210', 'BK001212', 'BK001214', 'BK001216', 'BK001218']
  }
]

export function EntitlementHistory() {
  const [activeTab, setActiveTab] = useState('vouchers')
  const [expandedPackage, setExpandedPackage] = useState<string | null>(null)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPackageTypeIcon = (type: string) => {
    switch (type) {
      case 'full-day': return '🌅'
      case 'half-day': return '🌤️'
      case 'study-hour': return '📚'
      default: return '📦'
    }
  }

  const getPackageStatusBadge = (status: string) => {
    switch (status) {
      case 'fully_used':
        return <Badge className="bg-blue-100 text-blue-800">Fully Used</Badge>
      case 'expired_with_remaining':
        return <Badge className="bg-red-100 text-red-800">Expired (Unused)</Badge>
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
    }
  }

  const VoucherCard = ({ voucher }: { voucher: UsedVoucher }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Gift className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-lg">{voucher.code}</h4>
              <p className="text-sm text-gray-600">{voucher.description}</p>
            </div>
          </div>
          <Badge className="bg-green-100 text-green-800">Used</Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
            <span>{formatDate(voucher.used_at)}</span>
          </div>
          <div className="flex items-center">
            <Ticket className="w-4 h-4 mr-2 text-gray-400" />
            <span>Ref: {voucher.booking_reference}</span>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t">
          <div className="flex justify-between items-center text-sm">
            <span>Original Amount:</span>
            <span className="line-through text-gray-500">${voucher.original_amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm text-green-600">
            <span>Discount:</span>
            <span>-${voucher.discount_amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center font-semibold">
            <span>Final Amount:</span>
            <span>${voucher.final_amount.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const PackageCard = ({ packageData }: { packageData: UsedPackage }) => {
    const isExpanded = expandedPackage === packageData.id
    const remaining = packageData.total_passes - packageData.passes_used

    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-lg">{getPackageTypeIcon(packageData.package_type)}</span>
              </div>
              <div>
                <h4 className="font-semibold text-lg">{packageData.name}</h4>
                <p className="text-sm text-gray-600">
                  {packageData.passes_used} of {packageData.total_passes} passes used
                  {remaining > 0 && ` (${remaining} unused)`}
                </p>
              </div>
            </div>
            {getPackageStatusBadge(packageData.final_status)}
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm mb-3">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
              <span>Purchased: {new Date(packageData.purchased_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2 text-gray-400" />
              <span>Expired: {new Date(packageData.expires_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Usage Progress Bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Usage Progress</span>
              <span>{Math.round((packageData.passes_used / packageData.total_passes) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  packageData.final_status === 'fully_used' 
                    ? 'bg-blue-600' 
                    : 'bg-red-500'
                }`}
                style={{ width: `${(packageData.passes_used / packageData.total_passes) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Booking References */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              Used in {packageData.booking_references.length} booking{packageData.booking_references.length !== 1 ? 's' : ''}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedPackage(isExpanded ? null : packageData.id)}
            >
              {isExpanded ? 'Hide Details' : 'Show Details'}
            </Button>
          </div>

          {isExpanded && (
            <div className="mt-3 pt-3 border-t">
              <h5 className="font-medium mb-2">Booking References:</h5>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {packageData.booking_references.map((ref, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {ref}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const totalVoucherSavings = mockUsedVouchers.reduce((sum, voucher) => sum + voucher.discount_amount, 0)
  const totalPackagesUsed = mockUsedPackages.length
  const totalPassesUsed = mockUsedPackages.reduce((sum, pkg) => sum + pkg.passes_used, 0)

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Gift className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">${totalVoucherSavings.toFixed(2)}</p>
            <p className="text-sm text-gray-600">Total Voucher Savings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold">{totalPackagesUsed}</p>
            <p className="text-sm text-gray-600">Packages Used</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingDown className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <p className="text-2xl font-bold">{totalPassesUsed}</p>
            <p className="text-sm text-gray-600">Total Packages Used</p>
          </CardContent>
        </Card>
      </div>

      {/* Entitlement History Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Ticket className="w-5 h-5 mr-2" />
            Discount & Package History
          </CardTitle>
          <p className="text-sm text-gray-600">
            Track your voucher usage and package consumption
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="vouchers" className="flex items-center gap-2">
                <Gift className="w-4 h-4" />
                Vouchers Used ({mockUsedVouchers.length})
              </TabsTrigger>
              <TabsTrigger value="packages" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Package History ({mockUsedPackages.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="vouchers" className="mt-6">
              {mockUsedVouchers.length > 0 ? (
                <div className="space-y-4">
                  {mockUsedVouchers.map(voucher => (
                    <VoucherCard key={voucher.id} voucher={voucher} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Gift className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No vouchers used yet</h3>
                  <p className="text-gray-600">Your used discount codes will appear here</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="packages" className="mt-6">
              {mockUsedPackages.length > 0 ? (
                <div className="space-y-4">
                  {mockUsedPackages.map(packageData => (
                    <PackageCard key={packageData.id} packageData={packageData} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No package history</h3>
                  <p className="text-gray-600">Your used and expired packages will appear here</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}