// src/lib/services/pricingService.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'https://productive-space-backend.vercel.app';

export interface PricingConfig {
  id: string;
  location: string;
  memberType: 'STUDENT' | 'MEMBER' | 'TUTOR';
  oneHourRate: number;
  overOneHourRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PricingData {
  student: { oneHourRate: number; overOneHourRate: number };
  member: { oneHourRate: number; overOneHourRate: number };
  tutor: { oneHourRate: number; overOneHourRate: number };
}

class PricingService {
  // Get all pricing configurations
  async getAllPricingConfigurations(): Promise<{ success: boolean; data?: PricingConfig[]; error?: string }> {
    try {
      console.log('🔍 Fetching all pricing configurations...');
      const response = await fetch(`${API_BASE_URL}/pricing`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
        console.error('❌ Error fetching pricing configurations:', errorData);
        throw new Error(errorData.error || 'Failed to fetch pricing configurations');
      }
      
      const data = await response.json();
      console.log('✅ Successfully fetched pricing configurations:', data);
      
      return { success: true, data: data.data || [] };
    } catch (error) {
      console.error('Error fetching pricing configurations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch pricing configurations'
      };
    }
  }

  // Get pricing by location and member type
  async getPricingByLocationAndMemberType(location: string, memberType: string): Promise<{ success: boolean; data?: PricingConfig; error?: string }> {
    try {
      console.log(`🔍 Fetching pricing for ${location} - ${memberType}...`);
      const response = await fetch(`${API_BASE_URL}/pricing/${location}/${memberType}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
        console.error('❌ Error fetching pricing:', errorData);
        throw new Error(errorData.error || 'Failed to fetch pricing');
      }
      
      const data = await response.json();
      console.log('✅ Successfully fetched pricing:', data);
      
      return { success: true, data: data.data };
    } catch (error) {
      console.error('Error fetching pricing:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch pricing'
      };
    }
  }

  // Get all pricing for a location
  async getAllPricingForLocation(location: string): Promise<{ success: boolean; data?: PricingData; error?: string }> {
    try {
      console.log(`🔍 Fetching all pricing for location: ${location}...`);
      const response = await fetch(`${API_BASE_URL}/pricing/${location}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
        console.error('❌ Error fetching location pricing:', errorData);
        throw new Error(errorData.error || 'Failed to fetch location pricing');
      }
      
      const data = await response.json();
      console.log('✅ Successfully fetched location pricing:', data);
      
      return { success: true, data: data.data };
    } catch (error) {
      console.error('Error fetching location pricing:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch location pricing'
      };
    }
  }

  // Get pricing by member type (across all locations)
  async getPricingByMemberType(memberType: string): Promise<{ success: boolean; data?: PricingConfig[]; error?: string }> {
    try {
      console.log(`🔍 Fetching pricing for member type: ${memberType}...`);
      const result = await this.getAllPricingConfigurations();
      
      if (!result.success || !result.data) {
        return result;
      }
      
      const filteredData = result.data.filter(pricing => pricing.memberType === memberType.toUpperCase() && pricing.isActive);
      console.log(`✅ Found ${filteredData.length} pricing configurations for ${memberType}`);
      
      return { success: true, data: filteredData };
    } catch (error) {
      console.error('Error fetching pricing by member type:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch pricing'
      };
    }
  }
}

export default new PricingService();

