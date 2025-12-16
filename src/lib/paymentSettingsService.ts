/**
 * Payment Settings Service
 * Fetches dynamic payment fee settings from backend
 */
import { authenticatedFetch } from './apiClient'

interface PaymentSettings {
  PAYNOW_TRANSACTION_FEE: number
  CREDIT_CARD_TRANSACTION_FEE_PERCENTAGE: number
  ADMIN_REFUND_FEE: number
  PAYNOW_ENABLED: boolean
  CREDIT_CARD_ENABLED: boolean
}

// Cache settings to reduce API calls
let cachedSettings: PaymentSettings | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Get default payment settings (fallback)
 */
function getDefaultSettings(): PaymentSettings {
  return {
    PAYNOW_TRANSACTION_FEE: 0.20,
    CREDIT_CARD_TRANSACTION_FEE_PERCENTAGE: 5.0,
    ADMIN_REFUND_FEE: 2.00,
    PAYNOW_ENABLED: true,
    CREDIT_CARD_ENABLED: true
  }
}

/**
 * Fetch payment settings from backend
 * Uses caching to improve performance
 */
export async function getPaymentSettings(): Promise<PaymentSettings> {
  try {
    // Check cache first
    const now = Date.now()
    if (cachedSettings && (now - cacheTimestamp) < CACHE_DURATION) {
      return cachedSettings
    }

    const response = await authenticatedFetch(
      `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/payment-settings`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch payment settings')
    }

    const result = await response.json()

    if (result.success && result.data) {
      // Convert array to object
      const settingsMap: any = {}
      result.data.forEach((setting: any) => {
        const value = setting.settingValue
        // Parse boolean values
        if (setting.settingType === 'boolean') {
          settingsMap[setting.settingKey] = value === 'true' || value === true
        } else {
          settingsMap[setting.settingKey] = parseFloat(value) || value
        }
      })

      const settings: PaymentSettings = {
        PAYNOW_TRANSACTION_FEE: settingsMap.PAYNOW_TRANSACTION_FEE || 0.20,
        CREDIT_CARD_TRANSACTION_FEE_PERCENTAGE: settingsMap.CREDIT_CARD_TRANSACTION_FEE_PERCENTAGE || 5.0,
        ADMIN_REFUND_FEE: settingsMap.ADMIN_REFUND_FEE || 2.00,
        PAYNOW_ENABLED: settingsMap.PAYNOW_ENABLED !== false,
        CREDIT_CARD_ENABLED: settingsMap.CREDIT_CARD_ENABLED !== false
      }

      // Update cache
      cachedSettings = settings
      cacheTimestamp = now

      return settings
    }

    return getDefaultSettings()
  } catch (error) {
    console.error('Error fetching payment settings:', error)
    return getDefaultSettings()
  }
}

/**
 * Calculate PayNow transaction fee
 * ONLY applies for amounts < $10
 */
export async function calculatePayNowFee(amount: number): Promise<number> {
  if (amount >= 10) return 0 // No fee for amounts >= $10
  const settings = await getPaymentSettings()
  return settings.PAYNOW_TRANSACTION_FEE
}

/**
 * Calculate Credit Card transaction fee
 */
export async function calculateCreditCardFee(amount: number): Promise<number> {
  const settings = await getPaymentSettings()
  const percentage = settings.CREDIT_CARD_TRANSACTION_FEE_PERCENTAGE
  return (amount * percentage) / 100
}

/**
 * Calculate total amount with transaction fee
 */
export async function calculateTotalWithFee(
  baseAmount: number,
  paymentMethod: 'paynow' | 'credit_card' | 'creditCard'
): Promise<{
  baseAmount: number
  transactionFee: number
  totalAmount: number
  feePercentage?: number
}> {
  const amount = parseFloat(baseAmount.toString())
  let transactionFee = 0
  let feePercentage: number | undefined

  const normalizedMethod = paymentMethod.toLowerCase().replace('_', '')

  if (normalizedMethod === 'paynow') {
    transactionFee = await calculatePayNowFee(amount)
  } else if (normalizedMethod === 'creditcard') {
    const settings = await getPaymentSettings()
    feePercentage = settings.CREDIT_CARD_TRANSACTION_FEE_PERCENTAGE
    transactionFee = await calculateCreditCardFee(amount)
  }

  return {
    baseAmount: amount,
    transactionFee,
    totalAmount: amount + transactionFee,
    feePercentage
  }
}

/**
 * Get fee label for display
 */
export async function getFeeLabel(paymentMethod: 'paynow' | 'credit_card' | 'creditCard'): Promise<string> {
  const settings = await getPaymentSettings()
  const normalizedMethod = paymentMethod.toLowerCase().replace('_', '')

  if (normalizedMethod === 'paynow') {
    return `PayNow Transaction Fee ($${settings.PAYNOW_TRANSACTION_FEE.toFixed(2)})`
  } else if (normalizedMethod === 'creditcard') {
    return `Credit Card Fee (${settings.CREDIT_CARD_TRANSACTION_FEE_PERCENTAGE}%)`
  }

  return 'Transaction Fee'
}

/**
 * Clear settings cache (useful after admin updates settings)
 */
export function clearPaymentSettingsCache(): void {
  cachedSettings = null
  cacheTimestamp = 0
}

/**
 * Check if payment method is enabled
 */
export async function isPaymentMethodEnabled(
  paymentMethod: 'paynow' | 'credit_card'
): Promise<boolean> {
  try {
    const settings = await getPaymentSettings()
    if (paymentMethod === 'paynow') {
      return settings.PAYNOW_ENABLED
    } else if (paymentMethod === 'credit_card') {
      return settings.CREDIT_CARD_ENABLED
    }
    return true
  } catch (error) {
    return true // Default to enabled on error
  }
}

