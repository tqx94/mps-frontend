'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Eye, Calendar, Users, Target, Gift, Globe, ChevronLeft, ChevronRight, Filter, X, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  PromoCode, 
  createPromoCode, 
  updatePromoCode, 
  deletePromoCode, 
  getAllPromoCodes,
  getPromoCodeDetails,
  formatDiscountDisplay,
  getPromoCodeTypeLabel,
  getPromoCodeStatusBadge
} from '@/lib/promoCodeService'
import { UserSelector } from './UserSelector'
import { formatLocalDate, fromDatePickerToUTC, toDateTimeInputValue } from '@/lib/timezoneUtils'

export function PromoCodeManagement() {
  const { toast } = useToast()
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterGroup, setFilterGroup] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  
  // Form state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [viewingPromo, setViewingPromo] = useState<PromoCode | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  
  // Delete confirmation modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [promoToDelete, setPromoToDelete] = useState<PromoCode | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Form submission loading state
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form fields
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discounttype: 'percentage' as 'percentage' | 'fixed',
    discountvalue: 0,
    maxDiscountAmount: 0,
    minimumamount: 0,
    minimum_hours: 0,
    activefrom: '',
    activeto: '',
    promoType: 'GENERAL' as 'GENERAL' | 'GROUP_SPECIFIC' | 'USER_SPECIFIC' | 'WELCOME',
    targetGroup: '' as '' | 'STUDENT' | 'MEMBER' | 'TUTOR',
    targetUserIds: [] as string[],
    maxusageperuser: 1,
    globalUsageLimit: 100,
    isactive: true,
    category: '',
    priority: 1
  })

  const formatPromoDateTime = (date?: string | null) => {
    if (!date) return null
    
    try {
      // Backend se jo UTC date aa rahi hai, usko current timezone mein convert karo
      let dateStr = date.trim()
      
      // Ensure date is treated as UTC (add 'Z' if not present)
      if (!dateStr.includes('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
        dateStr = dateStr + 'Z' // Treat as UTC
      }
      
      const dateObj = new Date(dateStr)
      
      if (isNaN(dateObj.getTime())) {
        console.error('Invalid date:', date)
        return date
      }
      
      // UTC ko current timezone mein convert karke format karo
      return dateObj.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
    } catch (error) {
      console.error('Error formatting date:', error, date)
      return date
    }
  }

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    fetchPromoCodes()
  }, [currentPage, debouncedSearchTerm, filterStatus, filterType, filterGroup])

  // Function to check and update expired promo codes
  const checkAndUpdateExpiredPromoCodes = async (promoCodes: PromoCode[]) => {
    const now = new Date()
    const expiredPromoCodes: PromoCode[] = []
    
    // Check each promo code for expiration
    for (const promo of promoCodes) {
      const activeto = promo.activeto || promo.activeTo
      
      // Skip if no expiry date or already inactive
      if (!activeto || !promo.isactive && !promo.isActive) {
        continue
      }
      
      // Parse the expiry date
      let expiryDate: Date
      try {
        // Ensure date is treated as UTC if no timezone info
        let dateStr = activeto.trim()
        if (!dateStr.includes('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
          dateStr = dateStr + 'Z'
        }
        expiryDate = new Date(dateStr)
        
        // Check if expired
        if (expiryDate < now && (promo.isactive || promo.isActive)) {
          expiredPromoCodes.push(promo)
        }
      } catch (error) {
        console.error('Error parsing expiry date for promo code:', promo.id, error)
        continue
      }
    }
    
      // Update expired promo codes
      if (expiredPromoCodes.length > 0) {
        const updatePromises = expiredPromoCodes.map(async (promo) => {
          try {
            // Get all required fields for update
            // Handle targetGroup type - only include if it's STUDENT or MEMBER (not TUTOR)
            const targetGroup = promo.targetGroup === 'STUDENT' || promo.targetGroup === 'MEMBER' 
              ? promo.targetGroup 
              : undefined
            
            const promoData = {
              code: promo.code,
              name: promo.name,
              description: promo.description || '',
              discounttype: promo.discounttype || promo.discountType || 'percentage',
              discountvalue: promo.discountvalue || promo.discountValue || 0,
              maxDiscountAmount: promo.maxDiscountAmount || promo.maxdiscountamount || 0,
              minimumamount: promo.minimumamount || promo.minimumAmount || 0,
              minimum_hours: promo.minimum_hours || promo.minimumhours || promo.minimumHours || 0,
              activefrom: promo.activefrom || promo.activeFrom || undefined,
              activeto: promo.activeto || promo.activeTo || undefined,
              promoType: promo.promoType,
              targetGroup: targetGroup,
              targetUserIds: promo.targetUserIds || undefined,
              maxusageperuser: promo.maxusageperuser || promo.maxUsagePerUser || 1,
              globalUsageLimit: promo.globalUsageLimit || promo.globalusagelimit || 100,
              isactive: false, // Set to inactive
              category: promo.category || undefined,
              priority: promo.priority || 1
            }
            
            await updatePromoCode(promo.id, promoData)
          } catch (error) {
            console.error(`Failed to update expired promo code ${promo.id}:`, error)
          }
        })
      
      // Wait for all updates to complete
      await Promise.all(updatePromises)
      
      // Refresh the list after updates
      return true
    }
    
    return false
  }

  const fetchPromoCodes = async () => {
    try {
      setLoading(true)
      
      // Handle combined GROUP_ filters
      let promoTypeParam = undefined
      let targetGroupParam = undefined
      
      if (filterType !== 'all') {
        if (filterType.startsWith('GROUP_')) {
          // Extract group type from GROUP_MEMBER, GROUP_STUDENT, etc.
          promoTypeParam = 'GROUP_SPECIFIC'
          targetGroupParam = filterType.replace('GROUP_', '')
        } else {
          promoTypeParam = filterType
        }
      }
      
      const response = await getAllPromoCodes({
        page: currentPage,
        limit: 20,
        search: debouncedSearchTerm || undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        promoType: promoTypeParam,
        targetGroup: targetGroupParam
      })
      
      // Check and update expired promo codes
      const needsRefresh = await checkAndUpdateExpiredPromoCodes(response.promoCodes)
      
      // If any promo codes were updated, refresh the list
      if (needsRefresh) {
        const refreshedResponse = await getAllPromoCodes({
          page: currentPage,
          limit: 20,
          search: debouncedSearchTerm || undefined,
          status: filterStatus !== 'all' ? filterStatus : undefined,
          promoType: promoTypeParam,
          targetGroup: targetGroupParam
        })
        setPromoCodes(refreshedResponse.promoCodes)
        setTotalPages(refreshedResponse.pagination.totalPages)
        setTotalItems(refreshedResponse.pagination.total)
      } else {
        setPromoCodes(response.promoCodes)
        setTotalPages(response.pagination.totalPages)
        setTotalItems(response.pagination.total)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch promo codes",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      discounttype: 'percentage',
      discountvalue: 0,
      maxDiscountAmount: 0,
      minimumamount: 0,
      minimum_hours: 0,
      activefrom: '',
      activeto: '',
      promoType: 'GENERAL',
      targetGroup: '',
      targetUserIds: [],
      maxusageperuser: 1,
      globalUsageLimit: 100,
      isactive: true,
      category: '',
      priority: 1
    })
    setEditingPromo(null)
    setIsEditing(false)
    setIsSubmitting(false)
  }

  const validateForm = (): string[] => {
    const errors: string[] = []
    
    // Required fields
    if (!formData.code.trim()) errors.push('Promo code is required')
    if (!formData.name.trim()) errors.push('Name is required')
    if (!formData.discountvalue || formData.discountvalue <= 0) errors.push('Discount value must be greater than 0')
    
    // Conditional validation based on promo type
    if (formData.promoType === 'GROUP_SPECIFIC' && !formData.targetGroup) {
      errors.push('Target group is required for group-specific codes')
    }
    
    if (formData.promoType === 'USER_SPECIFIC' && (!formData.targetUserIds || formData.targetUserIds.length === 0)) {
      errors.push('Target user IDs are required for user-specific codes')
    }
    
    // Discount validation
    if (formData.discounttype === 'percentage') {
      if (formData.discountvalue < 1 || formData.discountvalue > 100) {
        errors.push('Percentage must be between 1 and 100')
      }
      if (!formData.maxDiscountAmount || formData.maxDiscountAmount <= 0) {
        errors.push('Max discount amount is required for percentage discounts')
      }
    }
    
    // Date validation
    if (formData.activefrom && formData.activeto) {
      const fromDate = new Date(formData.activefrom)
      const toDate = new Date(formData.activeto)
      if (fromDate >= toDate) {
        errors.push('End date must be after start date')
      }
    }
    
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    const errors = validateForm()
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors.join(', '),
        variant: "destructive"
      })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // User ne jo local time select kiya, usko UTC mein convert karke backend ko bhejo
      let activefromUTC: string | undefined = undefined
      let activetoUTC: string | undefined = undefined
      
      if (formData.activefrom && formData.activefrom.trim()) {
        // datetime-local input se local time milta hai, isko UTC mein convert karo
        activefromUTC = fromDatePickerToUTC(formData.activefrom)
      }
      
      if (formData.activeto && formData.activeto.trim()) {
        // datetime-local input se local time milta hai, isko UTC mein convert karo
        activetoUTC = fromDatePickerToUTC(formData.activeto)
      }
      
      // Handle targetGroup type - only include if it's STUDENT or MEMBER (not TUTOR)
      const targetGroup: 'STUDENT' | 'MEMBER' | undefined = formData.promoType === 'GROUP_SPECIFIC' && formData.targetGroup 
        ? (formData.targetGroup === 'STUDENT' || formData.targetGroup === 'MEMBER' ? formData.targetGroup as 'STUDENT' | 'MEMBER' : undefined)
        : undefined
      
      const promoData = {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        discounttype: formData.discounttype,
        discountvalue: formData.discountvalue,
        maxDiscountAmount: formData.maxDiscountAmount,
        minimumamount: formData.minimumamount,
        minimum_hours: formData.minimum_hours,
        activefrom: activefromUTC,
        activeto: activetoUTC,
        promoType: formData.promoType,
        targetGroup: targetGroup,
        targetUserIds: formData.promoType === 'USER_SPECIFIC' ? formData.targetUserIds : undefined,
        maxusageperuser: formData.maxusageperuser,
        globalUsageLimit: formData.globalUsageLimit,
        isactive: formData.isactive,
        category: formData.category || undefined,
        priority: formData.priority
      }

      let response
      if (isEditing && editingPromo) {
        response = await updatePromoCode(editingPromo.id, promoData)
      } else {
        response = await createPromoCode(promoData)
      }

      if (response.success) {
        toast({
          title: "Success",
          description: isEditing ? "Promo code updated successfully" : "Promo code created successfully"
        })
        setIsCreateDialogOpen(false)
        resetForm()
        fetchPromoCodes()
        setIsSubmitting(false)
      } else {
        toast({
          title: response.error || "Error",
          description: response.message || response.error || "Failed to save promo code",
          variant: "destructive"
        })
        setIsSubmitting(false)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || error?.error || "Failed to save promo code",
        variant: "destructive"
      })
      setIsSubmitting(false)
    }
  }

  const handleEdit = (promo: PromoCode) => {
    console.log('Editing promo:', promo)
    console.log('minimum_hours:', promo.minimum_hours)
    console.log('minimumhours:', promo.minimumhours)
    console.log('minimumHours:', promo.minimumHours)
    setEditingPromo(promo)
    setIsEditing(true)
    
    // Backend se aayi UTC date ko local timezone mein convert karo for edit input
    const activefromValue = promo.activefrom || promo.activeFrom
    const activetoValue = promo.activeto || promo.activeTo
    
    const activefromLocal = activefromValue 
      ? toDateTimeInputValue(activefromValue) 
      : ''
    const activetoLocal = activetoValue 
      ? toDateTimeInputValue(activetoValue) 
      : ''
    
    setFormData({
      code: promo.code,
      name: promo.name,
      description: promo.description || '',
      discounttype: promo.discounttype || promo.discountType || '',
      discountvalue: promo.discountvalue || promo.discountValue || 0,
      maxDiscountAmount: promo.maxDiscountAmount || 0,
      minimumamount: promo.minimumamount || promo.minimumAmount || 0,
      minimum_hours: promo.minimum_hours || promo.minimumhours || promo.minimumHours || 0,
      activefrom: activefromLocal,
      activeto: activetoLocal,
      promoType: promo.promoType,
      targetGroup: promo.targetGroup || '',
      targetUserIds: promo.targetUserIds || [],
      maxusageperuser: promo.maxusageperuser || promo.maxUsagePerUser || 1,
      globalUsageLimit: promo.globalUsageLimit || 100,
      isactive: promo.isactive !== undefined ? promo.isactive : (promo.isActive !== undefined ? promo.isActive : true),
      category: promo.category || '',
      priority: promo.priority || 1
    })
    console.log('Form data set with minimum_hours:', promo.minimum_hours || promo.minimumhours || promo.minimumHours || 0)
    setIsCreateDialogOpen(true)
  }

  const handleView = async (promo: PromoCode) => {
    try {
      const response = await getPromoCodeDetails(promo.id)
      if (response.success && response.promoCode) {
        setViewingPromo(response.promoCode)
        setIsViewing(true)
      } else {
        toast({
          title: response.error || "Error",
          description: response.error || "Failed to fetch promo code details",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || error?.error || "Failed to fetch promo code details",
        variant: "destructive"
      })
    }
  }

  const handleDeleteClick = (promo: PromoCode) => {
    setPromoToDelete(promo)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!promoToDelete) return
    
    setIsDeleting(true)
    try {
      const response = await deletePromoCode(promoToDelete.id)
      if (response.success) {
        toast({
          title: "Success",
          description: "Promo code deleted successfully"
        })
        fetchPromoCodes()
        setDeleteConfirmOpen(false)
        setPromoToDelete(null)
      } else {
        toast({
          title: response.error || "Error",
          description: response.message || response.error || "Failed to delete promo code",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || error?.error || "Failed to delete promo code",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false)
    setPromoToDelete(null)
  }

  const getPromoTypeIcon = (type: string) => {
    switch (type) {
      case 'GENERAL': return <Globe className="w-4 h-4" />
      case 'GROUP_SPECIFIC': return <Users className="w-4 h-4" />
      case 'USER_SPECIFIC': return <Target className="w-4 h-4" />
      case 'WELCOME': return <Gift className="w-4 h-4" />
      default: return <Globe className="w-4 h-4" />
    }
  }

  const getPromoTypeColor = (type: string) => {
    switch (type) {
      case 'GENERAL': return 'bg-blue-100 text-blue-800'
      case 'GROUP_SPECIFIC': return 'bg-green-100 text-green-800'
      case 'USER_SPECIFIC': return 'bg-purple-100 text-purple-800'
      case 'WELCOME': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setDebouncedSearchTerm('')
    setFilterStatus('all')
    setFilterType('all')
    setFilterGroup('all')
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-2">
        <div>
          <h2 className="text-2xl font-bold">Promo Code Management</h2>
          <p className="text-gray-600">Manage promotional codes and discounts</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingPromo(null)
                resetForm()
              }}
              style={{ backgroundColor: '#ff6900' }}
              className="hover:opacity-90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Promo Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Edit Promo Code' : 'Create New Promo Code'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Required Fields Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Fields marked with * are required. 
                  Some fields become required based on your promo type selection.
                </p>
              </div>
              
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Promo Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    placeholder="e.g., STUDENT25, WELCOME20"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Student 25% Off"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe the promo code and its benefits"
                />
              </div>

              {/* Promo Type and Targeting */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="promoType">Promo Type *</Label>
                  <Select
                    value={formData.promoType}
                    onValueChange={(value: any) => setFormData({...formData, promoType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GENERAL">General Public</SelectItem>
                      <SelectItem value="GROUP_SPECIFIC">Group Specific</SelectItem>
                      <SelectItem value="USER_SPECIFIC">User Specific</SelectItem>
                      <SelectItem value="WELCOME">Welcome Code</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.promoType === 'GENERAL' && 'Available to everyone'}
                    {formData.promoType === 'GROUP_SPECIFIC' && 'Available to specific user groups (students, members, etc.)'}
                    {formData.promoType === 'USER_SPECIFIC' && 'Available to specific individual users only'}
                    {formData.promoType === 'WELCOME' && 'Available to new users for their first booking only'}
                  </p>
                </div>

                {formData.promoType === 'GROUP_SPECIFIC' && (
                  <div>
                    <Label htmlFor="targetGroup">Target Group *</Label>
                    <Select
                      value={formData.targetGroup}
                      onValueChange={(value: any) => setFormData({...formData, targetGroup: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select target group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STUDENT">Students</SelectItem>
                        <SelectItem value="MEMBER">Members</SelectItem>
                        <SelectItem value="TUTOR">Tutors</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">Select which user group can use this promo code</p>
                  </div>
                )}

                {formData.promoType === 'USER_SPECIFIC' && (
                  <div>
                    <Label htmlFor="targetUserIds">Select Target Users *</Label>
                    <UserSelector
                      selectedUserIds={formData.targetUserIds}
                      onSelectionChange={(userIds) => setFormData({
                        ...formData,
                        targetUserIds: userIds
                      })}
                      placeholder="Search and select users..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Select specific users who can use this promo code</p>
                  </div>
                )}
              </div>

              {/* Discount Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="discounttype">Discount Type *</Label>
                  <Select
                    value={formData.discounttype}
                    onValueChange={(value: any) => setFormData({...formData, discounttype: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="discountvalue">
                    {formData.discounttype === 'percentage' ? 'Discount %' : 'Discount Amount (SGD)'} *
                  </Label>
                  <Input
                    id="discountvalue"
                    type="number"
                    value={formData.discountvalue}
                    onChange={(e) => setFormData({...formData, discountvalue: parseFloat(e.target.value) || 0})}
                    min={formData.discounttype === 'percentage' ? '1' : '0.01'}
                    max={formData.discounttype === 'percentage' ? '100' : undefined}
                    step={formData.discounttype === 'percentage' ? '1' : '0.01'}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.discounttype === 'percentage' ? 'Enter percentage (1-100%)' : 'Enter fixed amount in SGD'}
                  </p>
                </div>

                <div>
                  <Label htmlFor="minimumamount">Minimum Amount (SGD)</Label>
                  <Input
                    id="minimumamount"
                    type="number"
                    value={formData.minimumamount}
                    onChange={(e) => setFormData({...formData, minimumamount: parseFloat(e.target.value) || 0})}
                    min="0"
                    step="0.01"
                    placeholder="0 (no minimum)"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum order amount required to use this promo code</p>
                </div>

                <div>
                  <Label htmlFor="minimum_hours">Minimum Hours</Label>
                  <Input
                    id="minimum_hours"
                    type="number"
                    value={formData.minimum_hours}
                    onChange={(e) => setFormData({...formData, minimum_hours: parseFloat(e.target.value) || 0})}
                    min="0"
                    step="0.5"
                    placeholder="0 (no minimum)"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum booking duration in hours required to use this promo code</p>
                </div>
              </div>

              {formData.discounttype === 'percentage' && (
                <div>
                  <Label htmlFor="maxDiscountAmount">Maximum Discount Amount (SGD) *</Label>
                  <Input
                    id="maxDiscountAmount"
                    type="number"
                    value={formData.maxDiscountAmount}
                    onChange={(e) => setFormData({...formData, maxDiscountAmount: parseFloat(e.target.value) || 0})}
                    min="0.01"
                    step="0.01"
                    placeholder="Required for percentage discounts"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Required to prevent excessive discounts on large orders</p>
                </div>
              )}

              {/* Usage Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxusageperuser">Max Usage Per User</Label>
                  <Input
                    id="maxusageperuser"
                    type="number"
                    value={formData.maxusageperuser}
                    onChange={(e) => setFormData({...formData, maxusageperuser: parseInt(e.target.value) || 1})}
                    min="1"
                    placeholder="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">How many times a single user can use this code</p>
                </div>

                <div>
                  <Label htmlFor="globalUsageLimit">Global Usage Limit</Label>
                  <Input
                    id="globalUsageLimit"
                    type="number"
                    value={formData.globalUsageLimit}
                    onChange={(e) => setFormData({...formData, globalUsageLimit: parseInt(e.target.value) || 100})}
                    min="1"
                    placeholder="100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Total number of times this code can be used by all users</p>
                </div>
              </div>

              {/* Time Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="activefrom">Active From</Label>
                  <Input
                    id="activefrom"
                    type="datetime-local"
                    value={formData.activefrom}
                    onChange={(e) => setFormData({...formData, activefrom: e.target.value})}
                    placeholder="Leave empty for immediate activation"
                  />
                  <p className="text-xs text-gray-500 mt-1">When this promo code becomes active (leave empty for immediate)</p>
                </div>

                <div>
                  <Label htmlFor="activeto">Active Until (Optional)</Label>
                  <Input
                    id="activeto"
                    type="datetime-local"
                    value={formData.activeto}
                    onChange={(e) => setFormData({...formData, activeto: e.target.value})}
                    placeholder="Leave empty for no expiration"
                  />
                  <p className="text-xs text-gray-500 mt-1">When this promo code expires (leave empty for no expiration)</p>
                </div>
              </div>

              {/* Priority and Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value) || 1})}
                    min="1"
                    max="10"
                    placeholder="1 (lowest) to 10 (highest)"
                  />
                  <p className="text-xs text-gray-500 mt-1">Higher priority codes are shown first</p>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    placeholder="e.g., STUDENT_PROMO, WELCOME_PROMO"
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional category for organization</p>
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center space-x-2">
                <input
                  id="isactive"
                  type="checkbox"
                  checked={formData.isactive}
                  onChange={(e) => setFormData({...formData, isactive: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="isactive">Active</Label>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false)
                    resetForm()
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  style={{ backgroundColor: '#ff6900' }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditing ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      {isEditing ? 'Update' : 'Create'} Promo Code
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Filters</CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search Promo Code</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Search by code or name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <Label htmlFor="type">Promo Type</Label>
              <Select value={filterType} onValueChange={(value) => {
                setFilterType(value)
                // Reset group filter when type changes
                if (!value.startsWith('GROUP_')) {
                  setFilterGroup('all')
                }
              }}>
                <SelectTrigger id="type" className="w-full">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="GENERAL">General</SelectItem>
                  <SelectItem value="WELCOME">Welcome</SelectItem>
                  <SelectItem value="GROUP_MEMBER">Group: Member</SelectItem>
                  <SelectItem value="GROUP_STUDENT">Group: Student</SelectItem>
                  <SelectItem value="GROUP_TUTOR">Group: Tutor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
     
      <Card>
        <CardHeader>
          <CardTitle>Promo Codes ({totalItems})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Gift className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-500" />
                <p className="text-gray-600">Loading promo codes...</p>
              </div>
            </div>
          ) : promoCodes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No promo codes found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Valid Period</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promoCodes.map((promo) => {
                      const statusBadge = getPromoCodeStatusBadge(promo)
                      return (
                        <TableRow key={promo.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getPromoTypeIcon(promo.promoType)}
                              <span className="font-mono font-medium">{promo.code}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{promo.name}</div>
                              {promo.description && (
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {promo.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getPromoTypeColor(promo.promoType)}>
                              {getPromoCodeTypeLabel(promo)}
                            </Badge>
                            {promo.targetGroup && (
                              <div className="text-xs text-gray-500 mt-1">
                                {promo.targetGroup}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{formatDiscountDisplay(promo)}</div>
                              {promo.minimumAmount && (
                                <div className="text-xs text-gray-500">
                                  Min: SGD {promo.minimumAmount}
                                </div>
                              )}
                              {(promo.minimum_hours || promo.minimumHours || promo.minimumhours) && (
                                <div className="text-xs text-blue-600">
                                  Min: {promo.minimum_hours || promo.minimumHours || promo.minimumhours}h
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusBadge.variant as any} className={statusBadge.className}>
                              {statusBadge.text}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{promo.currentUsage || 0}/{promo.globalUsageLimit || 100}</div>
                              <div className="text-xs text-gray-500">
                                {promo.maxUsagePerUser || 1} per user
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {formatPromoDateTime(promo.activefrom || promo.activeFrom) || 'Always'}
                            </span>
                          </div>
                          {(promo.activeto || promo.activeTo) && (
                            <div className="text-xs text-gray-500">
                              to {formatPromoDateTime(promo.activeto || promo.activeTo)}
                            </div>
                          )}
                        </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleView(promo)}
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(promo)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteClick(promo)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalItems)} of {totalItems} results
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                        if (pageNum > totalPages) return null
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
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
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Promo Code Details Modal */}
      <Dialog open={isViewing} onOpenChange={setIsViewing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Promo Code Details</DialogTitle>
          </DialogHeader>
          
          {viewingPromo && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Code</Label>
                  <p className="text-sm text-gray-600 font-mono">{viewingPromo.code}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-sm text-gray-600">{viewingPromo.name}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm text-gray-600">{viewingPromo.description || 'No description'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <p className="text-sm text-gray-600">{getPromoCodeTypeLabel(viewingPromo)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Discount</Label>
                  <p className="text-sm text-gray-600">{formatDiscountDisplay(viewingPromo)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Usage</Label>
                  <p className="text-sm text-gray-600">
                    {viewingPromo.currentUsage || 0} / {viewingPromo.globalUsageLimit || 100}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Per User Limit</Label>
                  <p className="text-sm text-gray-600">{viewingPromo.maxUsagePerUser || 1}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Minimum Amount (SGD)</Label>
                  <p className="text-sm text-gray-600">
                    {viewingPromo.minimumAmount || viewingPromo.minimumamount || 0}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Minimum Hours</Label>
                  <p className="text-sm text-gray-600">
                    {viewingPromo.minimum_hours || viewingPromo.minimumHours || viewingPromo.minimumhours || 0}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Active From</Label>
                  <p className="text-sm text-gray-600">
                    {(viewingPromo.activefrom || viewingPromo.activeFrom)
                      ? formatPromoDateTime(viewingPromo.activefrom || viewingPromo.activeFrom)
                      : 'Always'
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Active Until</Label>
                  <p className="text-sm text-gray-600">
                    {(viewingPromo.activeto || viewingPromo.activeTo)
                      ? formatPromoDateTime(viewingPromo.activeto || viewingPromo.activeTo)
                      : 'No expiration'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <Trash2 className="h-5 w-5 mr-2" />
              Delete Promo Code
            </DialogTitle>
          </DialogHeader>
          
          {promoToDelete && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  Are you sure you want to delete this promo code? This action cannot be undone.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Code:</span>
                  <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    {promoToDelete.code}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Name:</span>
                  <span className="text-sm text-gray-600">{promoToDelete.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Type:</span>
                  <span className="text-sm text-gray-600">{getPromoCodeTypeLabel(promoToDelete)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Usage:</span>
                  <span className="text-sm text-gray-600">
                    {promoToDelete.currentUsage || 0} / {promoToDelete.globalUsageLimit || 100}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}