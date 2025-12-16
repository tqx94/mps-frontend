'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { authenticatedFetch } from '@/lib/apiClient'
import { Loader2, Save, TestTube, Eye, EyeOff, Key, Link, Server, Lock, RefreshCw } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

interface TuyaSetting {
  id: number
  settingKey: string
  settingValue: string
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface FormData {
  [key: string]: string
}

export function TuyaSettingsManagement() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<TuyaSetting[]>([])
  const [formData, setFormData] = useState<FormData>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({})
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/tuya-settings`)
      const data = await response.json()

      if (data.success) {
        // Filter out MAX_ACCESS_COUNT from display (keep it hidden)
        const filteredSettings = data.data.filter((setting: TuyaSetting) => 
          setting.settingKey !== 'MAX_ACCESS_COUNT'
        )
        setSettings(filteredSettings)
        
        // Initialize form data with current values (including hidden MAX_ACCESS_COUNT)
        const initialFormData: FormData = {}
        data.data.forEach((setting: TuyaSetting) => {
          initialFormData[setting.settingKey] = setting.settingValue || ''
        })
        setFormData(initialFormData)
      } else {
        throw new Error(data.message || 'Failed to fetch settings')
      }
    } catch (error: any) {
      console.error('Error fetching Tuya settings:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to load Tuya settings',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const toggleShowSecret = (key: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleSaveSettings = async () => {
    try {
      setShowConfirmDialog(false)
      setSaving(true)

      // Build settings array for bulk update (only visible settings)
      const settingsToUpdate = settings.map(setting => ({
        settingKey: setting.settingKey,
        settingValue: formData[setting.settingKey] || ''
      }))

      // Always ensure MAX_ACCESS_COUNT is set to -1 (hidden field)
      settingsToUpdate.push({
        settingKey: 'MAX_ACCESS_COUNT',
        settingValue: '-1'
      })

      const response = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/tuya-settings/bulk-update`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ settings: settingsToUpdate })
        }
      )

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Tuya settings updated successfully'
        })
        await fetchSettings() // Reload settings
      } else {
        throw new Error(data.message || 'Failed to update settings')
      }
    } catch (error: any) {
      console.error('Error saving settings:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    try {
      setTesting(true)
      
      const response = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/tuya-settings/test-connection`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Connection Successful',
          description: `Connected to Tuya API successfully! Token expires at ${new Date(data.data.expiresAt).toLocaleString()}`,
        })
      } else {
        throw new Error(data.message || 'Connection failed')
      }
    } catch (error: any) {
      console.error('Error testing connection:', error)
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect to Tuya API. Please check your credentials.',
        variant: 'destructive'
      })
    } finally {
      setTesting(false)
    }
  }

  const getSettingIcon = (key: string) => {
    if (key.includes('CLIENT_ID')) return <Key className="w-4 h-4" />
    if (key.includes('SECRET')) return <Lock className="w-4 h-4" />
    if (key.includes('URL')) return <Link className="w-4 h-4" />
    if (key.includes('LOCK_ID')) return <Server className="w-4 h-4" />
    return <Key className="w-4 h-4" />
  }

  const isSecretField = (key: string) => {
    return key.includes('SECRET') || key.includes('CLIENT_ID')
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="w-5 h-5" />
          Tuya Smart Lock Configuration
        </CardTitle>
        <CardDescription>
          Manage Tuya Smart Lock API credentials and device settings. Changes take effect immediately.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info Alert */}
        <Alert>
          <AlertDescription>
            <strong>⚠️ Important:</strong> These settings control the Tuya Smart Lock integration. 
            Make sure to test the connection after updating credentials.
          </AlertDescription>
        </Alert>

        {/* Settings Form */}
        <div className="space-y-4">
          {settings.map((setting) => (
            <div key={setting.id} className="space-y-2">
              <Label htmlFor={setting.settingKey} className="flex items-center gap-2">
                {getSettingIcon(setting.settingKey)}
                <span className="font-medium">{setting.settingKey}</span>
              </Label>
              <p className="text-sm text-gray-500">{setting.description}</p>
              <div className="relative">
                <Input
                  id={setting.settingKey}
                  type={isSecretField(setting.settingKey) && !showSecrets[setting.settingKey] ? 'password' : 'text'}
                  value={formData[setting.settingKey] || ''}
                  onChange={(e) => handleInputChange(setting.settingKey, e.target.value)}
                  placeholder={`Enter ${setting.settingKey}`}
                  className="pr-10"
                />
                {isSecretField(setting.settingKey) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => toggleShowSecret(setting.settingKey)}
                  >
                    {showSecrets[setting.settingKey] ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={() => setShowConfirmDialog(true)}
            disabled={saving || testing}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
          
         

          <Button
            onClick={fetchSettings}
            disabled={saving || testing}
            variant="outline"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Confirmation Dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Save Settings</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to save these Tuya settings? Changes will take effect immediately and may affect the smart lock integration.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSaveSettings}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Save Settings
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Help Section */}
        {/* <Alert className="mt-6">
          <AlertDescription>
            <div className="space-y-2 text-sm">
              <p><strong>How to get Tuya credentials:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Go to <a href="https://iot.tuya.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Tuya IoT Platform</a></li>
                <li>Create/Login to your account</li>
                <li>Create a Cloud Project</li>
                <li>Get Access ID (Client ID) and Access Secret (Secret Key)</li>
                <li>Link your smart lock device to the project</li>
                <li>Get the Device ID from device management</li>
              </ol>
            </div>
          </AlertDescription>
        </Alert> */}
      </CardContent>
    </Card>
  )
}

