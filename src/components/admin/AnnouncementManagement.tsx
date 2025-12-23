'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, RefreshCw, MoveUp, MoveDown } from 'lucide-react'
import {
    getAllAnnouncementsAdmin,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    formatAnnouncementDate,
    type Announcement,
    type CreateAnnouncementPayload,
    type UpdateAnnouncementPayload,
    uploadAnnouncementImage,
    updateAnnouncementOrder
} from '@/lib/announcementService'
import { Upload, X } from 'lucide-react'

export function AnnouncementManagement() {
    const { toast } = useToast()
    const [announcements, setAnnouncements] = useState<Announcement[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
    const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        imageUrl: '',
        order: 0,
        isActive: true
    })

    useEffect(() => {
        fetchAnnouncements()
    }, [])

    const fetchAnnouncements = async () => {
        setIsLoading(true)
        try {
            const response = await getAllAnnouncementsAdmin()
            if (response.success && Array.isArray(response.data)) {
                setAnnouncements(response.data)
            } else {
                toast({
                    title: 'Error',
                    description: response.error || 'Failed to fetch announcements',
                    variant: 'destructive',
                })
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to fetch announcements',
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleOpenDialog = (announcement?: Announcement) => {
        if (announcement) {
            setEditingAnnouncement(announcement)
            setFormData({
                title: announcement.title,
                description: announcement.description || '',
                imageUrl: announcement.imageUrl || '',
                order: announcement.order,
                isActive: announcement.isActive
            })
            setPreviewUrl(announcement.imageUrl || null)
            setSelectedFile(null)
        } else {
            setEditingAnnouncement(null)
            setFormData({
                title: '',
                description: '',
                imageUrl: '',
                order: announcements.length + 1,
                isActive: true
            })
            setPreviewUrl(null)
            setSelectedFile(null)
        }
        setIsDialogOpen(true)
    }

    const handleCloseDialog = () => {
        setIsDialogOpen(false)
        setEditingAnnouncement(null)
        setFormData({
            title: '',
            description: '',
            imageUrl: '',
            order: 0,
            isActive: true
        })
        setPreviewUrl(null)
        setSelectedFile(null)
    }

    const handleSaveAnnouncement = async () => {
        if (!formData.title.trim()) {
            toast({
                title: 'Validation Error',
                description: 'Title is required',
                variant: 'destructive',
            })
            return
        }

        setIsSaving(true)
        try {
            let imageUrl = formData.imageUrl

            if (selectedFile) {
                const uploadResult = await uploadAnnouncementImage(selectedFile)
                if (uploadResult.success && uploadResult.url) {
                    imageUrl = uploadResult.url
                } else {
                    toast({
                        title: 'Error',
                        description: uploadResult.error || 'Failed to upload image',
                        variant: 'destructive',
                    })
                    setIsSaving(false)
                    return
                }
            }

            let response

            if (editingAnnouncement) {
                // Update existing announcement
                const payload: UpdateAnnouncementPayload = {
                    title: formData.title,
                    description: formData.description || undefined,
                    imageUrl: imageUrl || undefined,
                    order: formData.order,
                    isActive: formData.isActive
                }
                response = await updateAnnouncement(editingAnnouncement.id, payload)
            } else {
                // Create new announcement
                const payload: CreateAnnouncementPayload = {
                    title: formData.title,
                    description: formData.description || undefined,
                    imageUrl: imageUrl || undefined,
                    order: formData.order,
                    isActive: formData.isActive
                }
                response = await createAnnouncement(payload)
            }

            if (response.success) {
                toast({
                    title: 'Success',
                    description: editingAnnouncement
                        ? 'Announcement updated successfully'
                        : 'Announcement created successfully',
                })
                handleCloseDialog()
                fetchAnnouncements()
            } else {
                toast({
                    title: 'Error',
                    description: response.error || 'Failed to save announcement',
                    variant: 'destructive',
                })
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to save announcement',
                variant: 'destructive',
            })
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteClick = (announcement: Announcement) => {
        setDeletingAnnouncement(announcement)
        setIsDeleteDialogOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!deletingAnnouncement) return

        setIsSaving(true)
        try {
            const response = await deleteAnnouncement(deletingAnnouncement.id)

            if (response.success) {
                toast({
                    title: 'Success',
                    description: 'Announcement deleted successfully',
                })
                setIsDeleteDialogOpen(false)
                setDeletingAnnouncement(null)
                fetchAnnouncements()
            } else {
                toast({
                    title: 'Error',
                    description: response.error || 'Failed to delete announcement',
                    variant: 'destructive',
                })
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete announcement',
                variant: 'destructive',
            })
        } finally {
            setIsSaving(false)
        }
    }

    const handleMoveUp = async (announcement: Announcement) => {
        const currentIndex = announcements.findIndex(a => a.id === announcement.id)
        if (currentIndex <= 0) return

        const prevAnnouncement = announcements[currentIndex - 1]
        // Target order is the order of the item above us. 
        // Our backend swap logic will swap us into that slot and the other item out.
        // We use updateAnnouncementOrder which has the swap logic.
        const response = await updateAnnouncementOrder(announcement.id, prevAnnouncement.order)

        if (response.success) {
            fetchAnnouncements()
        } else {
            toast({
                title: 'Error',
                description: 'Failed to update announcement order',
                variant: 'destructive',
            })
        }
    }

    const handleMoveDown = async (announcement: Announcement) => {
        const currentIndex = announcements.findIndex(a => a.id === announcement.id)
        if (currentIndex === -1 || currentIndex >= announcements.length - 1) return

        const nextAnnouncement = announcements[currentIndex + 1]
        // Target order is the order of the item below us.
        const response = await updateAnnouncementOrder(announcement.id, nextAnnouncement.order)

        if (response.success) {
            fetchAnnouncements()
        } else {
            toast({
                title: 'Error',
                description: 'Failed to update announcement order',
                variant: 'destructive',
            })
        }
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start flex-col md:flex-row gap-2">
                        <CardTitle>Latest Announcements</CardTitle>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchAnnouncements}
                                disabled={isLoading}
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                            <Button size="sm" onClick={() => handleOpenDialog()}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Announcement
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                            <span className="text-sm text-gray-500">Loading announcements...</span>
                        </div>
                    ) : announcements.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-sm text-gray-500">No announcements found</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenDialog()}
                                className="mt-4"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Create First Announcement
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[80px]">Order</TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="w-[100px]">Status</TableHead>
                                        <TableHead className="w-[150px]">Updated</TableHead>
                                        <TableHead className="text-right w-[200px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {announcements.map((announcement, index) => (
                                        <TableRow key={announcement.id}>
                                            <TableCell className="font-medium">{index + 1}</TableCell>
                                            <TableCell className="font-medium">{announcement.title}</TableCell>
                                            <TableCell className="max-w-xs truncate">
                                                {announcement.description || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={announcement.isActive ? 'default' : 'secondary'}
                                                    className={
                                                        announcement.isActive
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }
                                                >
                                                    {announcement.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-gray-500">
                                                {formatAnnouncementDate(announcement.updatedAt)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleMoveUp(announcement)}
                                                        disabled={announcement.order <= 1}
                                                        title="Move Up"
                                                    >
                                                        <MoveUp className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleMoveDown(announcement)}
                                                        title="Move Down"
                                                    >
                                                        <MoveDown className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleOpenDialog(announcement)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteClick(announcement)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingAnnouncement
                                ? 'Update the announcement details below.'
                                : 'Fill in the details to create a new announcement.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label htmlFor="title" className="text-sm font-medium">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Enter announcement title"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="description" className="text-sm font-medium">
                                Description
                            </label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Enter announcement description (optional)"
                                rows={3}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">
                                Announcement Image
                            </label>
                            <div className="flex flex-col gap-4">
                                {previewUrl && (
                                    <div className="relative w-full h-48 bg-gray-100 rounded-md overflow-hidden border">
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="w-full h-full object-contain"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2 h-8 w-8 rounded-full"
                                            onClick={() => {
                                                setPreviewUrl(null)
                                                setSelectedFile(null)
                                                setFormData({ ...formData, imageUrl: '' })
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => document.getElementById('image-upload')?.click()}
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        {previewUrl ? 'Change Image' : 'Upload Image'}
                                    </Button>
                                    <input
                                        id="image-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                const file = e.target.files[0]
                                                setSelectedFile(file)
                                                setPreviewUrl(URL.createObjectURL(file))
                                            }
                                        }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500">
                                    Supported formats: JPG, PNG, GIF. Max size: 5MB.
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <label htmlFor="order" className="text-sm font-medium">
                                    Display Order
                                </label>
                                <Input
                                    id="order"
                                    type="number"
                                    min="1"
                                    value={formData.order}
                                    onChange={(e) =>
                                        setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <label htmlFor="isActive" className="text-sm font-medium">
                                    Status
                                </label>
                                <select
                                    id="isActive"
                                    value={formData.isActive ? 'active' : 'inactive'}
                                    onChange={(e) =>
                                        setFormData({ ...formData, isActive: e.target.value === 'active' })
                                    }
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseDialog} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveAnnouncement} disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Delete Announcement</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{deletingAnnouncement?.title}"? This action
                            cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsDeleteDialogOpen(false)
                                setDeletingAnnouncement(null)
                            }}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmDelete}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
