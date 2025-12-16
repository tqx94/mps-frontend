'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Package, Clock, Users, CheckCircle } from 'lucide-react'
import { UserPackage, calculatePackageDiscount, getHourlyRate, formatPackageDiscount } from '@/lib/services/packageApplicationService'

interface PackageSelectionProps {
  individualPersonHours: number // Hours per person (not total booking hours)
  totalPeople: number // Number of people in the booking
  userRole: 'STUDENT' | 'MEMBER' | 'TUTOR'
  userId: string
  onPackageSelect: (packageId: string | null, discount: any) => void
  selectedPackageId?: string | null
}

export default function PackageSelection({
  individualPersonHours,
  totalPeople,
  userRole,
  userId,
  onPackageSelect,
  selectedPackageId
}: PackageSelectionProps) {
  const [userPackages, setUserPackages] = useState<UserPackage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPackage, setSelectedPackage] = useState<string | null>(selectedPackageId || null)

  useEffect(() => {
    loadUserPackages()
  }, [userId, userRole])

  const loadUserPackages = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/booking/user-packages/${userId}/${userRole}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch packages')
      }

      const data = await response.json()
      
      if (data.success) {
        setUserPackages(data.packages)
      }
    } catch (error) {
      console.error('Error loading user packages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePackageSelect = (packageId: string | null) => {
    setSelectedPackage(packageId)
    
    if (packageId) {
      const packageData = userPackages.find(pkg => pkg.id === packageId)
      if (packageData) {
        const hourlyRate = getHourlyRate(userRole)
        const discount = calculatePackageDiscount(individualPersonHours, totalPeople, [packageData], userRole, hourlyRate)
        onPackageSelect(packageId, discount)
      }
    } else {
      const hourlyRate = getHourlyRate(userRole)
      const discount = calculatePackageDiscount(individualPersonHours, totalPeople, [], userRole, hourlyRate)
      onPackageSelect(null, discount)
    }
  }

  const getPackageIcon = (packageType: string) => {
    switch (packageType) {
      case 'HALF_DAY':
        return <Clock className="w-4 h-4" />
      case 'FULL_DAY':
        return <Users className="w-4 h-4" />
      case 'SEMESTER_BUNDLE':
        return <Package className="w-4 h-4" />
      default:
        return <Package className="w-4 h-4" />
    }
  }

  const getPackageColor = (packageType: string) => {
    switch (packageType) {
      case 'HALF_DAY':
        return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'FULL_DAY':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'SEMESTER_BUNDLE':
        return 'bg-green-50 text-green-700 border-green-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getPackageHourLimit = (packageType: string) => {
    switch (packageType) {
      case 'HALF_DAY':
        return '4 hours'
      case 'FULL_DAY':
        return '8 hours'
      case 'SEMESTER_BUNDLE':
        return '4 hours'
      default:
        return '0 hours'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Available Packages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Loading packages...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (userPackages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Available Packages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No packages available</p>
            <p className="text-xs text-gray-500 mt-1">Purchase packages to get discounts on bookings</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Available Packages
        </CardTitle>
        <p className="text-sm text-gray-600">
          Select a package to apply discount to your {individualPersonHours} hour booking per person
          {totalPeople > 1 && ` (${totalPeople} people total)`}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* No Package Option */}
        <div
          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
            selectedPackage === null
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => handlePackageSelect(null)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-sm font-medium">$</span>
              </div>
              <div>
                <h4 className="font-medium">Pay Full Price</h4>
                <p className="text-sm text-gray-600">No package discount applied</p>
              </div>
            </div>
            {selectedPackage === null && (
              <CheckCircle className="w-5 h-5 text-orange-500" />
            )}
          </div>
        </div>

        {/* Package Options */}
        {userPackages.map((pkg) => (
          <div
            key={pkg.id}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedPackage === pkg.id
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handlePackageSelect(pkg.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  {getPackageIcon(pkg.packageType)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{pkg.packageName}</h4>
                    <Badge className={getPackageColor(pkg.packageType)}>
                      {pkg.packageType.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Covers {getPackageHourLimit(pkg.packageType)} per day
                  </p>
                  <p className="text-xs text-gray-500">
                    {pkg.remainingCount} of {pkg.totalCount} packages remaining
                  </p>
                </div>
              </div>
              {selectedPackage === pkg.id && (
                <CheckCircle className="w-5 h-5 text-orange-500" />
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
