import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders, getOrderDetails, cancelOrder, resetOrderDatabase } from '@/lib/orderDatabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reset = searchParams.get('reset');

  if (reset === 'true') {
    resetOrderDatabase();
    return NextResponse.json({
      success: true,
      message: 'Order database reset to seed state.',
      orders: getAllOrders()
    });
  }

  const orders = getAllOrders();
  return NextResponse.json({ success: true, orders });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'MISSING_ORDER_ID', message: 'Order ID is required.' },
        { status: 400 }
      );
    }

    if (action === 'cancel') {
      const result = cancelOrder(orderId);
      return NextResponse.json({
        success: result.success,
        result,
        orders: getAllOrders()
      });
    }

    if (action === 'lookup' || !action) {
      const result = getOrderDetails(orderId);
      return NextResponse.json({
        success: result.found,
        result,
        orders: getAllOrders()
      });
    }

    return NextResponse.json(
      { success: false, error: 'INVALID_ACTION', message: `Unknown action "${action}"` },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
