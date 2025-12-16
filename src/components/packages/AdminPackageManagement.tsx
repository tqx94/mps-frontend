// src/components/packages/AdminPackageManagement.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Edit, Trash2, DollarSign, Clock, Calendar, Users, Star, Phone, Eye } from 'lucide-react';
import { useAdminPackages } from '@/hooks/useNewPackages';
import { NewPackage } from '@/lib/services/packageService';
import { useToast } from '@/hooks/use-toast';

export const AdminPackageManagement: React.FC = () => {
  const { packages, loading, error, fetchAllPackages, createPackage, updatePackage, deletePackage } = useAdminPackages();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<NewPackage | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<NewPackage | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  
  // Debug logging
  console.log('🔍 Admin Package Management - Packages:', packages);
  console.log('🔍 Admin Package Management - Loading:', loading);
  console.log('🔍 Admin Package Management - Error:', error);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    packageType: 'HALF_DAY' as 'HALF_DAY' | 'FULL_DAY' | 'SEMESTER_BUNDLE',
    targetRole: 'MEMBER' as 'MEMBER' | 'TUTOR' | 'STUDENT',
    price: '',
    originalPrice: '',
    outletFee: '5.00',
    passCount: '1',
    validityDays: '30'
  });

  useEffect(() => {
    const loadPackages = async () => {
      try {
        await fetchAllPackages();
        setSuccessMessage('Packages loaded successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err) {
        console.error('Error loading packages:', err);
      }
    };
    loadPackages();
  }, [fetchAllPackages]);

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    
    try {
      const packageData = {
        ...formData,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        outletFee: parseFloat(formData.outletFee),
        packageContents: {
          halfDayPasses: formData.packageContents.halfDayPasses ? parseInt(formData.packageContents.halfDayPasses) : undefined,
          fullDayPasses: formData.packageContents.fullDayPasses ? parseInt(formData.packageContents.fullDayPasses) : undefined,
          halfDayHours: parseInt(formData.packageContents.halfDayHours),
          fullDayHours: parseInt(formData.packageContents.fullDayHours),
          complimentaryHours: formData.packageContents.complimentaryHours ? parseInt(formData.packageContents.complimentaryHours) : undefined,
          totalHours: parseInt(formData.packageContents.totalHours)
        },
        validityDays: parseInt(formData.validityDays)
      };

      await createPackage(packageData);
      setShowCreateModal(false);
      resetForm();
      
      toast({
        title: "✅ Package Created",
        description: `"${formData.name}" has been successfully created.`,
        variant: "success",
      });
    } catch (error) {
      console.error('Error creating package:', error);
      toast({
        title: "❌ Creation Failed",
        description: `Failed to create "${formData.name}". Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackage) return;

    setIsUpdating(true);

    try {
      const packageData = {
        ...formData,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        outletFee: parseFloat(formData.outletFee),
        packageContents: {
          halfDayPasses: formData.packageContents.halfDayPasses ? parseInt(formData.packageContents.halfDayPasses) : undefined,
          fullDayPasses: formData.packageContents.fullDayPasses ? parseInt(formData.packageContents.fullDayPasses) : undefined,
          halfDayHours: parseInt(formData.packageContents.halfDayHours),
          fullDayHours: parseInt(formData.packageContents.fullDayHours),
          complimentaryHours: formData.packageContents.complimentaryHours ? parseInt(formData.packageContents.complimentaryHours) : undefined,
          totalHours: parseInt(formData.packageContents.totalHours)
        },
        validityDays: parseInt(formData.validityDays)
      };

      await updatePackage(editingPackage.id, packageData);
      setEditingPackage(null);
      setShowCreateModal(false);
      resetForm();
      
      toast({
        title: "✅ Package Updated",
        description: `"${formData.name}" has been successfully updated.`,
        variant: "success",
      });
    } catch (error) {
      console.error('Error updating package:', error);
      toast({
        title: "❌ Update Failed",
        description: `Failed to update "${formData.name}". Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletePackage = (packageId: string) => {
    // Find the package to get its details for the confirmation
    const packageToDelete = packages.find(pkg => pkg.id === packageId);
    setPackageToDelete(packageToDelete || null);
    setShowDeleteModal(true);
  };

  const confirmDeletePackage = async (force: boolean = false) => {
    if (!packageToDelete) return;

    setIsDeleting(true);

    try {
      await deletePackage(packageToDelete.id, force);
      setShowDeleteModal(false);
      setPackageToDelete(null);
      
      toast({
        title: "✅ Package Deleted",
        description: `"${packageToDelete.name}" has been successfully deleted.`,
        variant: "success",
      });
      setIsDeleting(false); // Reset state on success
    } catch (error: any) {
      console.error('Error deleting package:', error);
      
      // If error message says to use force=true, show option to force delete
      if (!force && error?.message?.includes('force=true')) {
        setIsDeleting(false); // Reset state before showing dialog
        
        const confirmForce = window.confirm(
          `Package has existing purchases. Do you want to force delete it?\n\nWarning: This will delete the package even though it has purchases.`
        );
        
        if (confirmForce) {
          await confirmDeletePackage(true); // Await the force delete
        }
        return;
      }
      
      toast({
        title: "❌ Deletion Failed",
        description: error?.message || `Failed to delete "${packageToDelete.name}". Please try again.`,
        variant: "destructive",
      });
      setIsDeleting(false); // Reset state on error
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      packageType: 'HALF_DAY',
      targetRole: 'MEMBER',
      price: '',
      originalPrice: '',
      outletFee: '5.00',
      packageContents: {
        halfDayPasses: '',
        fullDayPasses: '',
        halfDayHours: '6',
        fullDayHours: '12',
        complimentaryHours: '',
        totalHours: ''
      },
      validityDays: '30'
    });
  };

  const openEditModal = (pkg: NewPackage) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description,
      packageType: pkg.packageType,
      targetRole: pkg.targetRole,
      price: pkg.price.toString(),
      originalPrice: pkg.originalPrice?.toString() || '',
      outletFee: pkg.outletFee.toString(),
      packageContents: {
        halfDayPasses: pkg.packageContents.halfDayPasses?.toString() || '',
        fullDayPasses: pkg.packageContents.fullDayPasses?.toString() || '',
        halfDayHours: pkg.packageContents.halfDayHours?.toString() || '6',
        fullDayHours: pkg.packageContents.fullDayHours?.toString() || '12',
        complimentaryHours: pkg.packageContents.complimentaryHours?.toString() || '',
        totalHours: pkg.packageContents.totalHours.toString()
      },
      validityDays: pkg.validityDays.toString()
    });
    setShowCreateModal(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading packages...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>Error loading packages: {error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Package Management</h1>
          <p className="text-muted-foreground">
            Manage all packages in the system
            {packages && (
              <span className="ml-2 text-primary font-semibold">
                ({packages.length} packages)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={async () => {
              try {
                await fetchAllPackages();
                setSuccessMessage('Packages refreshed successfully!');
                setTimeout(() => setSuccessMessage(null), 3000);
                
                toast({
                  title: "🔄 Packages Refreshed",
                  description: "Package list has been successfully refreshed.",
                  variant: "success",
                });
              } catch (err) {
                console.error('Error refreshing packages:', err);
                toast({
                  title: "❌ Refresh Failed",
                  description: "Failed to refresh packages. Please try again.",
                  variant: "destructive",
                });
              }
            }}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button 
            onClick={() => {
              setEditingPackage(null);
              resetForm();
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white"
            disabled={isCreating || isUpdating || isDeleting}
          >
            <Plus className="h-4 w-4" />
            Create New Package
          </Button>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
          <AlertDescription>
            ✅ {successMessage}
          </AlertDescription>
        </Alert>
      )}

      <Card className='py-0'>
        <CardContent className="p-0">
         
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Target Role</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages && packages.length > 0 ? (
                  packages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{pkg.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">{pkg.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {pkg.packageContents.halfDayPasses && (
                            <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-1">
                              {pkg.packageContents.halfDayPasses} Half-Day ({pkg.packageContents.halfDayHours}hrs)
                            </span>
                          )}
                          {pkg.packageContents.fullDayPasses && (
                            <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs mr-1">
                              {pkg.packageContents.fullDayPasses} Full-Day ({pkg.packageContents.fullDayHours}hrs)
                            </span>
                          )}
                          {pkg.packageContents.complimentaryHours && (
                            <span className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                              +{pkg.packageContents.complimentaryHours} Bonus Hours
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={pkg.packageType === 'SEMESTER_BUNDLE' ? 'destructive' : 'secondary'}
                        className={pkg.packageType === 'SEMESTER_BUNDLE' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}
                      >
                        {pkg.packageType.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={`${
                          pkg.targetRole === 'MEMBER' ? 'border-blue-200 text-blue-800 bg-blue-50' :
                          pkg.targetRole === 'TUTOR' ? 'border-purple-200 text-purple-800 bg-purple-50' :
                          'border-green-200 text-green-800 bg-green-50'
                        }`}
                      >
                        {pkg.targetRole}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-semibold">SGD {pkg.price}</div>
                        {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                          <div className="text-sm text-muted-foreground line-through">SGD {pkg.originalPrice}</div>
                        )}
                        <div className="text-xs text-muted-foreground">+SGD {pkg.outletFee} fee</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {pkg.discount && pkg.discount > 0 ? (
                        <Badge className="bg-red-100 text-red-800">
                          {pkg.discount}% OFF
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Clock className="h-3 w-3" />
                        {pkg.packageContents.totalHours} hrs
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {pkg.validityDays} days
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={pkg.isActive ? 'default' : 'secondary'}
                        className={pkg.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                      >
                        {pkg.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(pkg)}
                          className="border-orange-200 text-orange-700 hover:bg-orange-50"
                          disabled={isCreating || isUpdating || isDeleting}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                       
                        </Button>
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePackage(pkg.id)}
                          className="border-red-200 text-red-700 hover:bg-red-50"
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-1" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="text-muted-foreground">
                          {loading ? 'Loading packages...' : 'No packages found'}
                        </div>
                        {!loading && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => fetchAllPackages()}
                          >
                            Refresh
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
        
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? 'Edit Package' : 'Create New Package'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={editingPackage ? handleUpdatePackage : handleCreatePackage} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Package Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetRole">Target Role</Label>
                <Select
                  value={formData.targetRole}
                  onValueChange={(value) => setFormData({...formData, targetRole: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="TUTOR">Tutor</SelectItem>
                    <SelectItem value="STUDENT">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="packageType">Package Type</Label>
                <Select
                  value={formData.packageType}
                  onValueChange={(value) => setFormData({...formData, packageType: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HALF_DAY">Half Day</SelectItem>
                    <SelectItem value="FULL_DAY">Full Day</SelectItem>
                    <SelectItem value="SEMESTER_BUNDLE">Semester Bundle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (SGD)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="originalPrice">Original Price (SGD)</Label>
                <Input
                  id="originalPrice"
                  type="number"
                  step="0.01"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({...formData, originalPrice: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="outletFee">Outlet Fee (SGD)</Label>
                <Input
                  id="outletFee"
                  type="number"
                  step="0.01"
                  value={formData.outletFee}
                  onChange={(e) => setFormData({...formData, outletFee: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validityDays">Validity Days</Label>
                <Input
                  id="validityDays"
                  type="number"
                  value={formData.validityDays}
                  onChange={(e) => setFormData({...formData, validityDays: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Package Contents</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="halfDayPasses">Half-Day Passes</Label>
                  <Input
                    id="halfDayPasses"
                    type="number"
                    value={formData.packageContents.halfDayPasses}
                    onChange={(e) => setFormData({
                      ...formData, 
                      packageContents: {...formData.packageContents, halfDayPasses: e.target.value}
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullDayPasses">Full-Day Passes</Label>
                  <Input
                    id="fullDayPasses"
                    type="number"
                    value={formData.packageContents.fullDayPasses}
                    onChange={(e) => setFormData({
                      ...formData, 
                      packageContents: {...formData.packageContents, fullDayPasses: e.target.value}
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="halfDayHours">Half-Day Hours</Label>
                  <Input
                    id="halfDayHours"
                    type="number"
                    value={formData.packageContents.halfDayHours}
                    onChange={(e) => setFormData({
                      ...formData, 
                      packageContents: {...formData.packageContents, halfDayHours: e.target.value}
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullDayHours">Full-Day Hours</Label>
                  <Input
                    id="fullDayHours"
                    type="number"
                    value={formData.packageContents.fullDayHours}
                    onChange={(e) => setFormData({
                      ...formData, 
                      packageContents: {...formData.packageContents, fullDayHours: e.target.value}
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="complimentaryHours">Complimentary Hours</Label>
                  <Input
                    id="complimentaryHours"
                    type="number"
                    value={formData.packageContents.complimentaryHours}
                    onChange={(e) => setFormData({
                      ...formData, 
                      packageContents: {...formData.packageContents, complimentaryHours: e.target.value}
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalHours">Total Hours</Label>
                  <Input
                    id="totalHours"
                    type="number"
                    value={formData.packageContents.totalHours}
                    onChange={(e) => setFormData({
                      ...formData, 
                      packageContents: {...formData.packageContents, totalHours: e.target.value}
                    })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowCreateModal(false)}
                disabled={isCreating || isUpdating}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-orange-600 hover:bg-orange-700 text-white"
                disabled={isCreating || isUpdating}
              >
                {isCreating || isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {editingPackage ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  editingPackage ? 'Update Package' : 'Create Package'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Confirm Package Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this package? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {packageToDelete && (
            <div className="py-4">
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-semibold text-lg">{packageToDelete.name}</h4>
                <p className="text-sm text-muted-foreground mt-1">{packageToDelete.description}</p>
                <div className="flex items-center gap-4 mt-3 text-sm">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-medium">SGD {packageToDelete.price}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{packageToDelete.packageContents.totalHours} hrs</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{packageToDelete.validityDays} days</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setPackageToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeletePackage}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Package
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
