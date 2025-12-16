'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { authenticatedFetch } from '@/lib/apiClient'
import { Loader2, Save, Calculator, DollarSign, CreditCard, Smartphone, RefreshCw, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface PaymentSetting {
  id: number
  settingKey: string
  settingValue: string
  settingType: string
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface FormData {
  [key: string]: string
}

export function PaymentSettingsManagement() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<PaymentSetting[]>([])
  const [formData, setFormData] = useState<FormData>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testAmount, setTestAmount] = useState('50')
  const [calculatedFees, setCalculatedFees] = useState<any>(null)

  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/payment-settings`)
      const data = await response.json()

      if (data.success) {
        setSettings(data.data)

        // Initialize form data with current values
        const initialFormData: FormData = {}
        data.data.forEach((setting: PaymentSetting) => {
          initialFormData[setting.settingKey] = setting.settingValue || ''
        })
        setFormData(initialFormData)
      } else {
        throw new Error(data.message || 'Failed to fetch settings')
      }
    } catch (error: any) {
      console.error('Error fetching payment settings:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to load payment settings',
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

  const handleSaveSettings = async () => {
    try {
      setSaving(true)

      // Build settings array for bulk update
      const settingsToUpdate = settings.map(setting => ({
        settingKey: setting.settingKey,
        settingValue: formData[setting.settingKey] || ''
      }))

      const response = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/payment-settings/bulk-update`,
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
          description: 'Payment settings updated successfully'
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

  const calculateFees = async () => {
    try {
      const amount = parseFloat(testAmount)
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: 'Invalid Amount',
          description: 'Please enter a valid positive number',
          variant: 'destructive'
        })
        return
      }

      // Calculate PayNow fee
      const paynowResponse = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/payment-settings/calculate-fee`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ amount, paymentMethod: 'paynow' })
        }
      )

      // Calculate Credit Card fee
      const creditCardResponse = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/payment-settings/calculate-fee`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ amount, paymentMethod: 'credit_card' })
        }
      )

      const paynowData = await paynowResponse.json()
      const creditCardData = await creditCardResponse.json()

      if (paynowData.success && creditCardData.success) {
        setCalculatedFees({
          paynow: paynowData.data,
          creditCard: creditCardData.data
        })
      }
    } catch (error) {
      console.error('Error calculating fees:', error)
      toast({
        title: 'Error',
        description: 'Failed to calculate fees',
        variant: 'destructive'
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD'
    }).format(amount)
  }

  const getSettingIcon = (key: string) => {
    if (key.includes('PAYNOW')) return <Smartphone className="w-4 h-4" />
    if (key.includes('CREDIT_CARD') || key.includes('CARD')) return <CreditCard className="w-4 h-4" />
    return <DollarSign className="w-4 h-4" />
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

  // Group settings by category
  const feeSettings = settings.filter(s => s.settingKey.includes('FEE'))
  const enableSettings = settings.filter(s => s.settingKey.includes('ENABLED'))
  // Filter out minimum amount settings (not needed)
  const otherSettings = settings.filter(s =>
    !s.settingKey.includes('FEE') &&
    !s.settingKey.includes('ENABLED') &&
    !s.settingKey.includes('MINIMUM')
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Payment Transaction Fee Settings
          </CardTitle>
          <CardDescription>
            Configure dynamic transaction fees for different payment methods. Changes apply immediately to all new transactions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Info Alert */}
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              <strong>Important:</strong> Transaction fees will be calculated automatically based on these settings.
              PayNow uses a fixed fee, while Credit Card uses a percentage fee.
            </AlertDescription>
          </Alert>

          {/* Fee Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Transaction Fees</h3>
            {feeSettings.map((setting) => (
              <div key={setting.id} className="space-y-2">
                <Label htmlFor={setting.settingKey} className="flex items-center gap-2">
                  {getSettingIcon(setting.settingKey)}
                  <span className="font-medium">{setting.settingKey.replace(/_/g, ' ')}</span>
                  {setting.settingKey.includes('PERCENTAGE') && (
                    <span className="text-sm text-gray-500">(in %)</span>
                  )}
                  {setting.settingKey.includes('PAYNOW') && !setting.settingKey.includes('ENABLED') && (
                    <span className="text-sm text-gray-500">(in SGD)</span>
                  )}
                </Label>
                <p className="text-sm text-gray-500">{setting.description}</p>
                <div className="flex items-center gap-2">
                  <Input
                    id={setting.settingKey}
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData[setting.settingKey] || ''}
                    onChange={(e) => handleInputChange(setting.settingKey, e.target.value)}
                    placeholder={`Enter ${setting.settingKey}`}
                    className="max-w-xs"
                  />
                  {setting.settingKey.includes('PERCENTAGE') && (
                    <span className="text-sm text-gray-600">%</span>
                  )}
                  {setting.settingKey.includes('PAYNOW') && !setting.settingKey.includes('ENABLED') && (
                    <span className="text-sm text-gray-600">SGD</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Admin Refund Fee */}
          {/* <div className="space-y-4 pt-6 border-t">
            <h3 className="text-lg font-semibold">Refund Settings</h3>
            <div className="space-y-2">
              <Label htmlFor="ADMIN_REFUND_FEE" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span className="font-medium">ADMIN REFUND FEE</span>
                <span className="text-sm text-gray-500">(in SGD)</span>
              </Label>
              <p className="text-sm text-gray-500">
                Fee deducted from all refund requests. This is non-refundable and covers administrative costs.
              </p>
              <div className="flex items-center gap-2">
                <Input
                  id="ADMIN_REFUND_FEE"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData['ADMIN_REFUND_FEE'] || ''}
                  onChange={(e) => handleInputChange('ADMIN_REFUND_FEE', e.target.value)}
                  placeholder="Enter admin refund fee (e.g., 2.00)"
                  className="max-w-xs"
                />
                <span className="text-sm text-gray-600">SGD</span>
              </div>
            </div>
          </div> */}


          {/* Enable/Disable Settings */}
          {/* {enableSettings.length > 0 && (
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-semibold">Payment Method Status</h3>
              {enableSettings.map((setting) => (
                <div key={setting.id} className="space-y-2">
                  <Label htmlFor={setting.settingKey} className="flex items-center gap-2">
                    {getSettingIcon(setting.settingKey)}
                    <span className="font-medium">{setting.settingKey.replace(/_/g, ' ')}</span>
                  </Label>
                  <p className="text-sm text-gray-500">{setting.description}</p>
                  <Select
                    value={formData[setting.settingKey] || 'true'}
                    onValueChange={(value) => handleInputChange(setting.settingKey, value)}
                  >
                    <SelectTrigger className="max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Enabled</SelectItem>
                      <SelectItem value="false">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )} */}

          {/* Other Settings */}
          {/* {otherSettings.length > 0 && (
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-semibold">Additional Settings</h3>
              {otherSettings.map((setting) => (
                <div key={setting.id} className="space-y-2">
                  <Label htmlFor={setting.settingKey} className="flex items-center gap-2">
                    {getSettingIcon(setting.settingKey)}
                    <span className="font-medium">{setting.settingKey.replace(/_/g, ' ')}</span>
                  </Label>
                  <p className="text-sm text-gray-500">{setting.description}</p>
                  <Input
                    id={setting.settingKey}
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData[setting.settingKey] || ''}
                    onChange={(e) => handleInputChange(setting.settingKey, e.target.value)}
                    placeholder={`Enter ${setting.settingKey}`}
                    className="max-w-xs"
                  />
                </div>
              ))}
            </div>
          )} */}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
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
              disabled={saving}
              variant="outline"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>



      {/* Help Section */}
      {/* <Alert>
        <AlertDescription>
          <div className="space-y-2 text-sm">
            <p><strong>How It Works:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>PayNow:</strong> Fixed fee added to transactions under $10 (e.g., $0.20)</li>
              <li><strong>Credit Card:</strong> Percentage of transaction amount (e.g., 5% of $50 = $2.50)</li>
              <li>Fees are automatically calculated during checkout</li>
              <li>Users see the total amount including fees before payment</li>
              <li>Changes take effect immediately for all new bookings</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert> */}
    </div>
  )
}

