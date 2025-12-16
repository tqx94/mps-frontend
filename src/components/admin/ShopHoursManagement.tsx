'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Clock, Calendar, Plus, Edit, Trash2, Save, X } from 'lucide-react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import {
    getOperatingHours,
    updateOperatingHours,
    getClosureDates,
    createClosureDate,
    updateClosureDate,
    deleteClosureDate,
    getDayName,
    formatTime,
    type OperatingHours,
    type ClosureDate
} from '@/lib/shopHoursService'
import { fromDatePickerToUTC } from '@/lib/timezoneUtils'

export function ShopHoursManagement() {
    const { toast } = useToast()
    const [selectedLocation, setSelectedLocation] = useState('Kovan')
    const [locations, setLocations] = useState<string[]>(['Kovan']) // Dynamic locations
    const [operatingHours, setOperatingHours] = useState<OperatingHours[]>([])
    const [closureDates, setClosureDates] = useState<ClosureDate[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Closure dialog state
    const [isClosureDialogOpen, setIsClosureDialogOpen] = useState(false)
    const [editingClosure, setEditingClosure] = useState<ClosureDate | null>(null)
    const [closureForm, setClosureForm] = useState({
        startDate: new Date(),
        endDate: new Date(),
        reason: ''
    })

    // Editing state for operating hours
    const [editingHours, setEditingHours] = useState<{ [key: string]: { openTime: string; closeTime: string } }>({})

    // Fetch locations from pricing API
    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/pricing`)
                const data = await response.json()
                if (data.success && data.data) {
                    const uniqueLocations = [...new Set(data.data.map((item: any) => item.location))]
                    setLocations(uniqueLocations as string[])
                    if (uniqueLocations.length > 0 && !selectedLocation) {
                        setSelectedLocation(uniqueLocations[0] as string)
                    }
                }
            } catch (error) {
                console.error('Error fetching locations:', error)
                // Fallback to default location
                setLocations(['Kovan'])
            }
        }
        fetchLocations()
    }, [])

    useEffect(() => {
        loadData()
    }, [selectedLocation])

    const loadData = async () => {
        try {
            setLoading(true)
            const [hours, closures] = await Promise.all([
                getOperatingHours(selectedLocation),
                getClosureDates(selectedLocation)
            ])
            setOperatingHours(hours)
            setClosureDates(closures)
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to load shop hours',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateOperatingHours = async (id: string, openTime: string, closeTime: string) => {
        try {
            setSaving(true)
            await updateOperatingHours(id, openTime, closeTime)
            toast({
                title: 'Success',
                description: 'Operating hours updated successfully'
            })
            await loadData()
            setEditingHours({})
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update operating hours',
                variant: 'destructive'
            })
        } finally {
            setSaving(false)
        }
    }

    const handleCreateClosure = async () => {
        try {
            setSaving(true)
            // Convert to UTC for storage (DatePicker gives local time)
            const startAtUTC = fromDatePickerToUTC(closureForm.startDate)
            const endAtUTC = fromDatePickerToUTC(closureForm.endDate)

            await createClosureDate(
                selectedLocation,
                startAtUTC,
                endAtUTC,
                closureForm.reason
            )
            toast({
                title: 'Success',
                description: 'Closure date created successfully'
            })
            setIsClosureDialogOpen(false)
            setClosureForm({ startDate: new Date(), endDate: new Date(), reason: '' })
            await loadData()
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to create closure date',
                variant: 'destructive'
            })
        } finally {
            setSaving(false)
        }
    }

    const handleUpdateClosure = async () => {
        if (!editingClosure) return

        try {
            setSaving(true)
            // Convert to UTC for storage (DatePicker gives local time)
            const startAtUTC = fromDatePickerToUTC(closureForm.startDate)
            const endAtUTC = fromDatePickerToUTC(closureForm.endDate)

            await updateClosureDate(
                editingClosure.id,
                startAtUTC,
                endAtUTC,
                closureForm.reason
            )
            toast({
                title: 'Success',
                description: 'Closure date updated successfully'
            })
            setIsClosureDialogOpen(false)
            setEditingClosure(null)
            setClosureForm({ startDate: new Date(), endDate: new Date(), reason: '' })
            await loadData()
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update closure date',
                variant: 'destructive'
            })
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteClosure = async (id: string) => {
        if (!confirm('Are you sure you want to delete this closure date?')) return

        try {
            await deleteClosureDate(id)
            toast({
                title: 'Success',
                description: 'Closure date deleted successfully'
            })
            await loadData()
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete closure date',
                variant: 'destructive'
            })
        }
    }

    const openEditClosure = (closure: ClosureDate) => {
        setEditingClosure(closure)
        setClosureForm({
            startDate: new Date(closure.startDate),
            endDate: new Date(closure.endDate),
            reason: closure.reason
        })
        setIsClosureDialogOpen(true)
    }

    const openNewClosure = () => {
        setEditingClosure(null)
        setClosureForm({ startDate: new Date(), endDate: new Date(), reason: '' })
        setIsClosureDialogOpen(true)
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Location Selector */}
            <Card>
                <CardHeader>
                    <CardTitle>Select Location</CardTitle>
                    <CardDescription>Choose a location to manage its operating hours and closures</CardDescription>
                </CardHeader>
                <CardContent>
                    <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                        <SelectTrigger className="max-w-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {locations.map((location) => (
                                <SelectItem key={location} value={location}>
                                    {location}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Operating Hours */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Daily Operating Hours
                    </CardTitle>
                    <CardDescription>Set the opening and closing times for each day of the week</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Day</TableHead>
                                <TableHead>Open Time</TableHead>
                                <TableHead>Close Time</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {operatingHours.map((hours) => {
                                const isEditing = editingHours[hours.id]
                                return (
                                    <TableRow key={hours.id}>
                                        <TableCell className="font-medium">{getDayName(hours.dayOfWeek)}</TableCell>
                                        <TableCell>
                                            {isEditing ? (
                                                <Input
                                                    type="time"
                                                    value={isEditing.openTime}
                                                    onChange={(e) => setEditingHours({
                                                        ...editingHours,
                                                        [hours.id]: { ...isEditing, openTime: e.target.value }
                                                    })}
                                                    className="w-32"
                                                />
                                            ) : (
                                                formatTime(hours.openTime)
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {isEditing ? (
                                                <Input
                                                    type="time"
                                                    value={isEditing.closeTime}
                                                    onChange={(e) => setEditingHours({
                                                        ...editingHours,
                                                        [hours.id]: { ...isEditing, closeTime: e.target.value }
                                                    })}
                                                    className="w-32"
                                                />
                                            ) : (
                                                formatTime(hours.closeTime)
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {isEditing ? (
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleUpdateOperatingHours(hours.id, isEditing.openTime + ':00', isEditing.closeTime + ':00')}
                                                        disabled={saving}
                                                    >
                                                        <Save className="w-4 h-4 mr-1" />
                                                        Save
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            const newEditing = { ...editingHours }
                                                            delete newEditing[hours.id]
                                                            setEditingHours(newEditing)
                                                        }}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setEditingHours({
                                                        ...editingHours,
                                                        [hours.id]: {
                                                            openTime: hours.openTime.substring(0, 5),
                                                            closeTime: hours.closeTime.substring(0, 5)
                                                        }
                                                    })}
                                                >
                                                    <Edit className="w-4 h-4 mr-1" />
                                                    Edit
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Closure Dates */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                Special Closures
                            </CardTitle>
                            <CardDescription>Manage vacation dates, holidays, and maintenance periods</CardDescription>
                        </div>
                        <Button onClick={openNewClosure}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Closure
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {closureDates.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No closure dates set. Click "Add Closure" to create one.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Start Date</TableHead>
                                    <TableHead>End Date</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {closureDates.map((closure) => (
                                    <TableRow key={closure.id}>
                                        <TableCell>{new Date(closure.startDate).toLocaleString()}</TableCell>
                                        <TableCell>{new Date(closure.endDate).toLocaleString()}</TableCell>
                                        <TableCell>{closure.reason}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => openEditClosure(closure)}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleDeleteClosure(closure.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Closure Dialog */}
            <Dialog open={isClosureDialogOpen} onOpenChange={setIsClosureDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingClosure ? 'Edit' : 'Add'} Closure Date</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Start Date & Time</Label>
                            <DatePicker
                                selected={closureForm.startDate}
                                onChange={(date) => setClosureForm({ ...closureForm, startDate: date || new Date() })}
                                showTimeSelect
                                dateFormat="Pp"
                                className="w-full border rounded-md px-3 py-2"
                            />
                        </div>
                        <div>
                            <Label>End Date & Time</Label>
                            <DatePicker
                                selected={closureForm.endDate}
                                onChange={(date) => setClosureForm({ ...closureForm, endDate: date || new Date() })}
                                showTimeSelect
                                dateFormat="Pp"
                                minDate={closureForm.startDate}
                                className="w-full border rounded-md px-3 py-2"
                            />
                        </div>
                        <div>
                            <Label>Reason</Label>
                            <Textarea
                                value={closureForm.reason}
                                onChange={(e) => setClosureForm({ ...closureForm, reason: e.target.value })}
                                placeholder="e.g., Vacation, Maintenance, Holiday"
                                rows={3}
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setIsClosureDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={editingClosure ? handleUpdateClosure : handleCreateClosure}
                                disabled={saving || !closureForm.reason}
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    editingClosure ? 'Update' : 'Create'
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
