// src/components/admin/AdminStats.tsx
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, Users, Calendar, DollarSign } from 'lucide-react'

export default function AdminStats({ cancellations, users }:any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="p-4 text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-600" />
          <p className="text-2xl font-bold">
            {cancellations.filter((c:any) => c.status === 'pending').length}
          </p>
          <p className="text-sm text-gray-600">Pending Cancellations</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
          <p className="text-2xl font-bold">
            {users.filter((u:any) => u.verificationStatus === 'pending').length}
          </p>
          <p className="text-sm text-gray-600">Pending Verifications</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <Calendar className="w-8 h-8 mx-auto mb-2 text-green-600" />
          <p className="text-2xl font-bold">
            {users.reduce((sum:any, u:any) => sum + u.totalBookings, 0)}
          </p>
          <p className="text-sm text-gray-600">Total Bookings</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <DollarSign className="w-8 h-8 mx-auto mb-2 text-purple-600" />
          <p className="text-2xl font-bold">
            ${users.reduce((sum:any, u:any) => sum + u.totalSpent, 0)}
          </p>
          <p className="text-sm text-gray-600">Total Revenue</p>
        </CardContent>
      </Card>
    </div>
  )
}
