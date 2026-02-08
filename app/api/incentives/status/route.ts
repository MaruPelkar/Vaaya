import { NextRequest, NextResponse } from 'next/server';
import { getRewardDetails, getBalance, getProducts } from '@/lib/tremendous';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rewardId = searchParams.get('rewardId');
    const action = searchParams.get('action'); // 'balance' | 'products' | 'status'

    if (action === 'balance') {
      const balance = await getBalance();
      return NextResponse.json({
        success: true,
        balance,
      });
    }

    if (action === 'products') {
      const products = await getProducts();
      return NextResponse.json({
        success: true,
        products,
      });
    }

    if (!rewardId) {
      return NextResponse.json({
        success: false,
        error: 'Missing rewardId parameter'
      }, { status: 400 });
    }

    const details = await getRewardDetails(rewardId);

    if (!details) {
      return NextResponse.json({
        success: false,
        error: 'Reward not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      reward: details,
    });
  } catch (error) {
    console.error('[Incentives Status API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
