// Tremendous API Integration for Gift Card Incentives
// Documentation: https://developers.tremendous.com

const tremendousApiKey = process.env.TREMENDOUS_API_KEY;
const tremendousBaseUrl = process.env.TREMENDOUS_SANDBOX === 'true'
  ? 'https://testflight.tremendous.com/api/v2'
  : 'https://www.tremendous.com/api/v2';

if (!tremendousApiKey) {
  console.warn('TREMENDOUS_API_KEY is not set. Incentive features will be disabled.');
}

export interface RewardParams {
  recipientEmail: string;
  recipientName: string;
  amount: number; // In USD (e.g., 50 for $50)
  campaignId?: string; // For tracking in Tremendous
  message?: string;
  productIds?: string[]; // Specific products to offer (optional)
}

export interface RewardResult {
  success: boolean;
  rewardId?: string;
  orderId?: string;
  status?: string;
  redeemUrl?: string;
  error?: string;
}

export interface RewardDetails {
  id: string;
  orderId: string;
  status: 'PENDING' | 'DELIVERED' | 'REDEEMED' | 'CANCELED' | 'EXPIRED';
  recipientEmail: string;
  recipientName: string;
  amount: number;
  deliveredAt?: string;
  redeemedAt?: string;
  redeemUrl?: string;
}

/**
 * Send a gift card reward via Tremendous
 */
export async function sendReward(params: RewardParams): Promise<RewardResult> {
  if (!tremendousApiKey) {
    return { success: false, error: 'Tremendous API key not configured' };
  }

  try {
    // First, get the funding source (usually there's a default one)
    const fundingRes = await fetch(`${tremendousBaseUrl}/funding_sources`, {
      headers: {
        'Authorization': `Bearer ${tremendousApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const fundingData = await fundingRes.json();
    const fundingSourceId = fundingData.funding_sources?.[0]?.id;

    if (!fundingSourceId) {
      return { success: false, error: 'No funding source configured in Tremendous' };
    }

    // Create the order
    const response = await fetch(`${tremendousBaseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tremendousApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payment: {
          funding_source_id: fundingSourceId,
        },
        rewards: [
          {
            value: {
              denomination: params.amount,
              currency_code: 'USD',
            },
            delivery: {
              method: 'EMAIL',
            },
            recipient: {
              email: params.recipientEmail,
              name: params.recipientName,
            },
            // If no specific products, Tremendous will offer recipient's choice
            ...(params.productIds?.length ? { products: params.productIds } : {}),
          },
        ],
        // External reference for tracking
        external_id: params.campaignId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.errors?.[0]?.message || data.message || `HTTP ${response.status}`,
      };
    }

    const reward = data.order?.rewards?.[0];

    return {
      success: true,
      orderId: data.order?.id,
      rewardId: reward?.id,
      status: reward?.delivery?.status,
      redeemUrl: reward?.delivery?.link,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Tremendous sendReward error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Get details about a specific reward
 */
export async function getRewardDetails(rewardId: string): Promise<RewardDetails | null> {
  if (!tremendousApiKey) {
    console.error('Tremendous API key not configured');
    return null;
  }

  try {
    const response = await fetch(`${tremendousBaseUrl}/rewards/${rewardId}`, {
      headers: {
        'Authorization': `Bearer ${tremendousApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Tremendous getRewardDetails error: HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();
    const reward = data.reward;

    return {
      id: reward.id,
      orderId: reward.order_id,
      status: reward.delivery?.status || 'PENDING',
      recipientEmail: reward.recipient?.email,
      recipientName: reward.recipient?.name,
      amount: reward.value?.denomination,
      deliveredAt: reward.delivery?.delivered_at,
      redeemedAt: reward.delivery?.redeemed_at,
      redeemUrl: reward.delivery?.link,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Tremendous getRewardDetails error:', errorMessage);
    return null;
  }
}

/**
 * Get available products (gift card options)
 */
export async function getProducts(): Promise<Array<{
  id: string;
  name: string;
  category: string;
  minValue: number;
  maxValue: number;
  imageUrl?: string;
}>> {
  if (!tremendousApiKey) {
    console.error('Tremendous API key not configured');
    return [];
  }

  try {
    const response = await fetch(`${tremendousBaseUrl}/products`, {
      headers: {
        'Authorization': `Bearer ${tremendousApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Tremendous getProducts error: HTTP ${response.status}`);
      return [];
    }

    const data = await response.json();

    return (data.products || []).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      name: p.name as string,
      category: p.category as string,
      minValue: (p.min_value as number) || 1,
      maxValue: (p.max_value as number) || 500,
      imageUrl: (p.images as Record<string, string>)?.url,
    }));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Tremendous getProducts error:', errorMessage);
    return [];
  }
}

/**
 * Cancel a pending reward
 */
export async function cancelReward(rewardId: string): Promise<{ success: boolean; error?: string }> {
  if (!tremendousApiKey) {
    return { success: false, error: 'Tremendous API key not configured' };
  }

  try {
    const response = await fetch(`${tremendousBaseUrl}/rewards/${rewardId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${tremendousApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const data = await response.json();
      return {
        success: false,
        error: data.errors?.[0]?.message || `HTTP ${response.status}`,
      };
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Tremendous cancelReward error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Get account balance
 */
export async function getBalance(): Promise<{ balance: number; currency: string } | null> {
  if (!tremendousApiKey) {
    console.error('Tremendous API key not configured');
    return null;
  }

  try {
    const response = await fetch(`${tremendousBaseUrl}/funding_sources`, {
      headers: {
        'Authorization': `Bearer ${tremendousApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const source = data.funding_sources?.[0];

    if (!source) return null;

    return {
      balance: source.meta?.available_cents ? source.meta.available_cents / 100 : 0,
      currency: 'USD',
    };
  } catch (error) {
    console.error('Tremendous getBalance error:', error);
    return null;
  }
}
