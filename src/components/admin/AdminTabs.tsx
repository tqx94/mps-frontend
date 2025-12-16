// src/components/admin/AdminTabs.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, Clock, Search, Settings, Mail, FileText, RefreshCw, Key } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PromoCodeManagement } from './PromoCodeManagement'
import { BookingManagement } from './BookingManagement'
import { UserManagement } from './UserManagement'
import PackageManagement from './PackageManagement'
import PackageUsageTable from './PackageUsageTable'
import { RefundManagement } from './RefundManagement'
import { PricingManagement } from './PricingManagement'
import { TuyaSettingsManagement } from './TuyaSettingsManagement'
import { PaymentSettingsManagement } from './PaymentSettingsManagement'
import { AnnouncementManagement } from './AnnouncementManagement'
import { ShopHoursManagement } from './ShopHoursManagement'
import OpenDoorExample from '@/components/OpenDoorExample'
import AdminDoorUnlock from '../AdminDoorUnlock'

export default function AdminTabs({
  activeTab,
  setActiveTab,
  refundRequests,
  users,
  pendingStudents,
  isLoadingPendingStudents,
  isLoadingRefunds,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  setSelectedUser,
  StatusBadge,
  filteredRefundRequests,
  filteredUsers
}: {
  activeTab: string
  setActiveTab: (value: string) => void
  refundRequests: any[]
  users: any[]
  pendingStudents: any[]
  isLoadingPendingStudents: boolean
  isLoadingRefunds: boolean
  searchTerm: string
  setSearchTerm: (value: string) => void
  filterStatus: string
  setFilterStatus: (value: string) => void
  setSelectedUser: (value: any) => void
  StatusBadge: any
  filteredRefundRequests: any[]
  filteredUsers: any[]
}) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList
        className="flex w-full justify-start overflow-x-auto whitespace-nowrap px-6 py-2 relative"
        style={{ scrollBehavior: 'smooth' }}
      >

        <TabsTrigger value="overview" className="snap-start">
          Overview
          {pendingStudents.length > 0 && (
            <span className="ml-2 bg-orange-500 text-white text-xs rounded-full px-2 py-1">
              {pendingStudents.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="announcements">Latest Announcement</TabsTrigger>

        <TabsTrigger value="bookings" className="snap-start">Bookings</TabsTrigger>
        <TabsTrigger value="user-management" className="snap-start">User Management</TabsTrigger>
        <TabsTrigger value="packages" className="snap-start">Packages</TabsTrigger>
        <TabsTrigger value="package-usage" className="snap-start">Package Usage</TabsTrigger>
        <TabsTrigger value="promocodes" className="snap-start">Promo Codes</TabsTrigger>
        <TabsTrigger value="refunds" className="snap-start">User Credits</TabsTrigger>
        <TabsTrigger value="pricing" className="snap-start">Pricing</TabsTrigger>
        <TabsTrigger value="payment-settings" className="snap-start flex items-center whitespace-nowrap">
          Payment Settings
        </TabsTrigger>
        <TabsTrigger value="door-lock" className="snap-start flex items-center whitespace-nowrap">
          Door Lock
        </TabsTrigger>
        <TabsTrigger value="tuya-settings" className="snap-start flex items-center whitespace-nowrap">
          Tuya Settings
        </TabsTrigger>
        <TabsTrigger value="shop-hours" className="snap-start flex items-center whitespace-nowrap">
          Shop Hours
        </TabsTrigger>

      </TabsList>

      {/* Overview Tab */}
      <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Refund Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Recent Refund Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingRefunds ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-gray-500">Loading refund requests...</span>
                </div>
              ) : refundRequests.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No recent refund requests</p>
                </div>
              ) : (
                <>
                  {refundRequests.map(refund => (
                    <div key={refund.id} className="flex justify-between items-center py-3 border-b last:border-b-0">
                      <div>
                        <p className="font-medium text-sm">{refund.Booking?.bookingRef || 'N/A'}</p>
                        <p className="text-xs text-gray-600">{refund.User?.email || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={refund.refundstatus} />
                        <p className="text-xs text-gray-600 mt-1">${refund.refundamount?.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full mt-4" onClick={() => setActiveTab('refunds')}>
                    View All Refund Requests
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Pending Verifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Pending Student Verifications
                </div>
                <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                  {pendingStudents.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingPendingStudents ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Loading pending students...</p>
                </div>
              ) : (
                <>
                  {pendingStudents.slice(0, 3).map(student => (
                    <div key={student.id} className="flex justify-between items-center py-3 border-b last:border-b-0">
                      <div>
                        <p className="font-medium text-sm">
                          {student.firstName && student.lastName
                            ? `${student.firstName} ${student.lastName}`
                            : student.email.split('@')[0]
                          }
                        </p>
                        <p className="text-xs text-gray-600">{student.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={student.studentVerificationStatus} />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedUser(student)}
                          className="h-7 px-2 text-xs"
                        >
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                  {pendingStudents.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">No pending student verifications</p>
                    </div>
                  )}
                </>
              )}
              <Button variant="outline" className="w-full mt-4" onClick={() => setActiveTab('user-management')}>
                View All Users
              </Button>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Latest Announcement Tab */}
      <TabsContent value="announcements" className="space-y-4">
        <AnnouncementManagement />
      </TabsContent>


      {/* Users Tab */}
      <TabsContent value="users">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>User Management</CardTitle>
              <div className="flex space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredUsers.map(user => (
                <div key={user.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{user.name}</h4>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <StatusBadge status={user.verificationStatus} />
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setSelectedUser(user)}>
                    Review Verification
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Promo Codes Tab */}
      <TabsContent value="promocodes" className="space-y-4">
        <PromoCodeManagement />
      </TabsContent>

      {/* Refund Management Tab */}
      <TabsContent value="refunds" className="space-y-4">
        <RefundManagement />
      </TabsContent>

      {/* Bookings Tab */}
      <TabsContent value="bookings" className="space-y-4">
        <BookingManagement />
      </TabsContent>

      {/* User Management Tab */}
      <TabsContent value="user-management" className="space-y-4">
        <UserManagement />
      </TabsContent>

      <TabsContent value="packages" className="space-y-4">
        <PackageManagement />
      </TabsContent>

      <TabsContent value="package-usage" className="space-y-4">
        <PackageUsageTable />
      </TabsContent>

      {/* Pricing Management Tab */}
      <TabsContent value="pricing" className="space-y-4">
        <PricingManagement />
      </TabsContent>

      {/* Payment Settings Tab */}
      <TabsContent value="payment-settings" className="space-y-4">
        <PaymentSettingsManagement />
      </TabsContent>

      {/* Door Lock Tab */}
      <TabsContent value="door-lock" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">

              Door Access Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AdminDoorUnlock />
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tuya Settings Tab */}
      <TabsContent value="tuya-settings" className="space-y-4">
        <TuyaSettingsManagement />
      </TabsContent>

      {/* Shop Hours Tab */}
      <TabsContent value="shop-hours" className="space-y-4">
        <ShopHoursManagement />
      </TabsContent>

      {/* Settings Tab */}
      <TabsContent value="settings">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Admin Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                <strong>Demo Mode:</strong> Example admin settings section.
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <Button variant="outline" className="w-full">
                <Mail className="w-4 h-4 mr-2" /> Manage Templates
              </Button>
              <Button variant="outline" className="w-full">
                <FileText className="w-4 h-4 mr-2" /> Edit Policies
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
