'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  DollarSign, 
  Edit, 
  Save, 
  X, 
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Settings
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { 
  getAllPricingConfigurations, 
  upsertPricingConfiguration, 
  deletePricingConfiguration,
  PricingConfiguration 
} from '@/lib/pricingService'

export function PricingManagement() {
  const [pricingConfigs, setPricingConfigs] = useState<PricingConfiguration[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<PricingConfiguration | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    location: 'Kovan',
    memberType: '' as 'STUDENT' | 'MEMBER' | 'TUTOR' | '',
    oneHourRate: '',
    overOneHourRate: '',
    isActive: true
  })

  const locations = ['Kovan'] // Only Kovan location
  const memberTypes = [
    { value: 'STUDENT', label: 'Student' },
    { value: 'MEMBER', label: 'Member' },
    { value: 'TUTOR', label: 'Tutor' }
  ]

  const fetchPricingConfigs = async () => {
    try {
      setLoading(true)
      const configs = await getAllPricingConfigurations()
      setPricingConfigs(configs)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch pricing configurations",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPricingConfigs()
  }, [])

  const handleEdit = (config: PricingConfiguration) => {
    setEditingConfig(config)
    setFormData({
      location: config.location,
      memberType: config.memberType,
      oneHourRate: config.oneHourRate.toString(),
      overOneHourRate: config.overOneHourRate.toString(),
      isActive: config.isActive
    })
    setIsDialogOpen(true)
  }

  const handleAddNew = () => {
    setEditingConfig(null)
    setFormData({
      location: 'Kovan',
      memberType: '' as 'STUDENT' | 'MEMBER' | 'TUTOR' | '',
      oneHourRate: '',
      overOneHourRate: '',
      isActive: true
    })
    setIsDialogOpen(true)
  }

  // Auto-update overOneHourRate when oneHourRate changes - same value
  const handleOneHourRateChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      oneHourRate: value,
      overOneHourRate: value // Same value for both
    }))
  }

  const handleSubmit = async () => {
    if (!formData.location || !formData.memberType || !formData.oneHourRate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      await upsertPricingConfiguration({
        location: formData.location,
        memberType: formData.memberType as 'STUDENT' | 'MEMBER' | 'TUTOR',
        oneHourRate: parseFloat(formData.oneHourRate),
        overOneHourRate: parseFloat(formData.overOneHourRate),
        isActive: formData.isActive
      } as any)

      toast({
        title: "Success",
        description: editingConfig ? "Pricing configuration updated successfully" : "Pricing configuration created successfully"
      })

      setIsDialogOpen(false)
      fetchPricingConfigs()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save pricing configuration",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pricing configuration?')) {
      return
    }

    try {
      await deletePricingConfiguration(id)
      toast({
        title: "Success",
        description: "Pricing configuration deleted successfully"
      })
      fetchPricingConfigs()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete pricing configuration",
        variant: "destructive"
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD'
    }).format(amount)
  }

  const getMemberTypeBadge = (memberType: string) => {
    const colors = {
      'STUDENT': 'bg-orange-100 text-orange-800',
      'MEMBER': 'bg-orange-200 text-orange-900',
      'TUTOR': 'bg-orange-300 text-orange-900'
    }
    return (
      <Badge className={colors[memberType as keyof typeof colors]}>
        {memberTypes.find(mt => mt.value === memberType)?.label || memberType}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Loading pricing configurations...
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-orange-600" />
              <span className="text-orange-900">Pricing Management</span>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchPricingConfigs} variant="outline" size="sm" className="border-orange-200 text-orange-700 hover:bg-orange-50">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                {/* <DialogTrigger asChild>
                   <Button onClick={handleAddNew} className="bg-orange-600 hover:bg-orange-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Pricing
                  </Button> 
                </DialogTrigger> */}
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingConfig ? 'Edit Pricing Configuration' : 'Add New Pricing Configuration'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* <div>
                      <Label htmlFor="location">Location</Label>
                      <Select 
                        value={formData.location || 'Kovan'} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map(location => (
                            <SelectItem key={location} value={location}>{location}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div> */}

                    <div>
                      <Label htmlFor="memberType">Member Type</Label>
                      <Select 
                        value={formData.memberType} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, memberType: value as 'STUDENT' | 'MEMBER' | 'TUTOR' }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select member type" />
                        </SelectTrigger>
                        <SelectContent>
                          {memberTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="oneHourRate">1 Hour Rate (SGD)</Label>
                      <Input
                        id="oneHourRate"
                        type="number"
                        step="0.01"
                        value={formData.oneHourRate}
                        onChange={(e) => handleOneHourRateChange(e.target.value)}
                        placeholder="e.g., 5.00"
                      />
                    </div>

                    {/* TODO: Uncomment when project is complete - Auto-update overOneHourRate field
                    <div>
                      <Label htmlFor="overOneHourRate">&gt;1 Hour Rate (SGD) <span className="text-sm text-gray-500">(Auto-updated)</span></Label>
                      <Input
                        id="overOneHourRate"
                        type="number"
                        step="0.01"
                        value={formData.overOneHourRate}
                        placeholder="e.g., 4.00"
                        className="bg-gray-50"
                        readOnly
                      />
                      <p className="text-xs text-gray-500 mt-1">Automatically set to same value as 1 Hour Rate</p>
                    </div>
                    */}


                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-orange-600 hover:bg-orange-700 text-white">
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            {editingConfig ? 'Update' : 'Create'}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> Changes to pricing will affect all new bookings. 
              Existing bookings will retain their original pricing.
            </AlertDescription>
          </Alert> */}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead>Member Type</TableHead>
                  <TableHead>1 Hour Rate</TableHead>
                  {/* <TableHead>>1 Hour Rate</TableHead> */}
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pricingConfigs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No pricing configurations found
                    </TableCell>
                  </TableRow>
                ) : (
                  pricingConfigs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell className="font-medium">{config.location}</TableCell>
                      <TableCell>{getMemberTypeBadge(config.memberType)}</TableCell>
                      <TableCell>{formatCurrency(config.oneHourRate)}</TableCell>
                      {/* <TableCell>{formatCurrency(config.overOneHourRate)}</TableCell> */}
                      <TableCell>
                        <Badge className={config.isActive ? "bg-orange-100 text-orange-800" : "bg-gray-100 text-gray-600"}>
                          {config.isActive ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            'Inactive'
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(config)}
                            className="border-orange-200 text-orange-700 hover:bg-orange-50"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          {/* <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(config.id)}
                            className="border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <X className="h-3 w-3" />
                          </Button> */}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
