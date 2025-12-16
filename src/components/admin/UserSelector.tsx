'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getAllUsers, User } from '@/lib/userService'
import { getEffectiveMemberType, getMemberTypeDisplayName } from '@/lib/userProfileService'

interface UserSelectorProps {
  selectedUserIds: string[]
  onSelectionChange: (userIds: string[]) => void
  placeholder?: string
  disabled?: boolean
}

export function UserSelector({ 
  selectedUserIds, 
  onSelectionChange, 
  placeholder = "Select users...",
  disabled = false 
}: UserSelectorProps) {
  const [open, setOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await getAllUsers({ 
        limit: 1000, // Get all users for selection
        includeStats: false // We don't need stats for selection
      })
      
      if (response.success && response.users) {
        setUsers(response.users)
      } else {
        console.error('Failed to fetch users:', response.error)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedUsers = users.filter(user => selectedUserIds.includes(user.id))

  const handleUserToggle = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      onSelectionChange(selectedUserIds.filter(id => id !== userId))
    } else {
      onSelectionChange([...selectedUserIds, userId])
    }
  }

  const removeUser = (userId: string) => {
    onSelectionChange(selectedUserIds.filter(id => id !== userId))
  }

  const selectAllUsers = () => {
    onSelectionChange(users.map(user => user.id))
  }

  const clearAllUsers = () => {
    onSelectionChange([])
  }

  const getUserDisplayName = (user: User) => {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim()
    if (fullName) {
      return fullName
    }
    return user.email.split('@')[0] // Show username part of email if no name
  }

  const getUserFullDisplayName = (user: User) => {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim()
    if (fullName) {
      return `${fullName} (${user.email})`
    }
    return user.email
  }

  const getUserSubtitle = (user: User) => {
    const parts = []
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim()
    if (fullName) {
      parts.push(user.email)
    }
    const effectiveMemberType = getEffectiveMemberType(user.memberType, user.studentVerificationStatus)
    if (effectiveMemberType) {
      parts.push(effectiveMemberType)
    }
    return parts.join(' • ')
  }

  const getUserBadgeVariant = (user: User) => {
    const effectiveMemberType = getEffectiveMemberType(user.memberType, user.studentVerificationStatus)
    if (effectiveMemberType === 'MEMBER') return 'default'
    if (effectiveMemberType === 'STUDENT') return 'secondary'
    return 'secondary'
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {selectedUserIds.length > 0 
              ? `${selectedUserIds.length} user${selectedUserIds.length > 1 ? 's' : ''} selected`
              : placeholder
            }
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search by name or email..." />
            <CommandList>
              {users.length > 0 && (
                <div className="flex gap-2 p-2 border-b">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllUsers}
                    className="h-7 text-xs"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllUsers}
                    className="h-7 text-xs"
                  >
                    Clear All
                  </Button>
                </div>
              )}
              {loading ? (
                <CommandEmpty>Loading users...</CommandEmpty>
              ) : users.length === 0 ? (
                <CommandEmpty>No users found.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {users.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={user.email}
                      onSelect={() => handleUserToggle(user.id)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <Check
                          className={cn(
                            "h-4 w-4",
                            selectedUserIds.includes(user.id) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {getUserDisplayName(user).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex flex-col flex-1">
                            <span className="font-medium">{getUserDisplayName(user)}</span>
                            <span className="text-sm text-muted-foreground">
                              {getUserSubtitle(user)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Users Display */}
      {selectedUsers.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Selected Users ({selectedUsers.length})
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllUsers}
              disabled={disabled}
              className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Clear All
            </Button>
          </div>
          <div className="max-h-32 overflow-y-auto border rounded-md p-2 bg-gray-50">
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-1 bg-white border rounded-full px-3 py-1 text-sm shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">
                        {getUserDisplayName(user).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900 text-xs">
                        {getUserDisplayName(user)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {user.memberType}
                        {user.studentVerificationStatus === 'VERIFIED' && ' • Student'}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 hover:bg-red-100 hover:text-red-600 ml-1"
                    onClick={() => removeUser(user.id)}
                    disabled={disabled}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
