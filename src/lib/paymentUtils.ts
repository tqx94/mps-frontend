/**
 * Payment utility functions for consistent calculations across the application
 * NOW USING DYNAMIC FEE SETTINGS FROM DATABASE
 */

import { 
  getPaymentSettings, 
  calculateCreditCardFee as dynamicCalculateCreditCardFee,
  calculatePayNowFee as dynamicCalculatePayNowFee,
  calculateTotalWithFee
} from './paymentSettingsService'

/**
 * Calculate credit card fee with proper rounding to 2 decimal places
 * NOW DYNAMIC - Uses database settings
 * @param amount - The base amount to calculate fee on
 * @returns The credit card fee rounded to 2 decimal places
 */
export async function calculateCreditCardFee(amount: number): Promise<number> {
  const fee = await dynamicCalculateCreditCardFee(amount)
  // Round to 2 decimal places using proper rounding logic
  return Math.round(fee * 100) / 100
}

/**
 * Calculate PayNow transaction fee
 * NOW DYNAMIC - Uses database settings
 * ONLY applies for amounts < $10
 * @param amount - The base amount
 * @returns The PayNow fee from database settings (0 if amount >= $10)
 */
export async function calculatePayNowFee(amount: number): Promise<number> {
  if (amount >= 10) return 0 // No fee for amounts >= $10
  const fee = await dynamicCalculatePayNowFee(amount)
  return Math.round(fee * 100) / 100
}

/**
 * Calculate total amount including fees based on payment method
 * NOW DYNAMIC - Uses database settings
 * @param baseAmount - The base amount
 * @param paymentMethod - The payment method ('creditCard' or 'payNow')
 * @returns Promise with object containing fee and total
 */
export async function calculatePaymentTotal(baseAmount: number, paymentMethod: 'creditCard' | 'payNow'): Promise<{
  fee: number
  total: number
}> {
  let fee = 0
  
  if (paymentMethod === 'creditCard') {
    fee = await calculateCreditCardFee(baseAmount)
  } else if (paymentMethod === 'payNow') {
    fee = await calculatePayNowFee(baseAmount)
  }
  
  const total = baseAmount + fee
  
  return {
    fee: Math.round(fee * 100) / 100,
    total: Math.round(total * 100) / 100
  }
}

/**
 * Get dynamic fee percentage for display (e.g., "5.0%" for credit card)
 */
export async function getFeeLabelPercentage(): Promise<string> {
  const settings = await getPaymentSettings()
  return `${settings.CREDIT_CARD_TRANSACTION_FEE_PERCENTAGE}%`
}

/**
 * Format currency amount to 2 decimal places
 * @param amount - The amount to format
 * @returns Formatted amount string
 */
export function formatCurrency(amount: number): string {
  return amount.toFixed(2)
}
