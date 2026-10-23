import { Order, OrderStatus } from './types';

// Initial Seed Database according to DataStraw specification
const SEED_ORDERS: Record<string, Order> = {
  'ORD-101': {
    orderId: 'ORD-101',
    customerName: 'Priya Sharma',
    product: 'Vitamin C Serum (30ml)',
    value: 699,
    status: 'Out for Delivery',
    carrier: 'BlueDart',
    trackingNumber: 'BD-982103',
    estimatedDelivery: 'Expected by 6 PM today',
    notes: 'BlueDart — BD-982103. Expected by 6 PM today',
    canCancel: false,
    canReturn: false,
    policyNotes: 'Order is currently Out for Delivery with courier. Policy strictly forbids cancellation. If customer no longer wants the item, advise them to refuse delivery at their doorstep.'
  },
  'ORD-102': {
    orderId: 'ORD-102',
    customerName: 'Rahul Verma',
    product: 'Hydrating Sunscreen SPF 50',
    value: 499,
    status: 'Delivered',
    carrier: 'Delhivery',
    trackingNumber: 'DL-441029',
    deliveredDate: '14 days ago',
    daysSinceDelivery: 14,
    notes: 'Delhivery — DL-441029. Delivered 14 days ago',
    canCancel: false,
    canReturn: false,
    policyNotes: 'Delivered 14 days ago. Aura policy requires returns within 7 days for unopened products. Request must be politely declined based on policy.'
  },
  'ORD-103': {
    orderId: 'ORD-103',
    customerName: 'Ananya Patel',
    product: 'Green Tea Face Wash + Toner',
    value: 850,
    status: 'Processing',
    carrier: 'Unassigned (Warehouse)',
    notes: 'Ordered 3 hours ago. Eligible for cancellation',
    canCancel: true,
    canReturn: false,
    policyNotes: 'Order is in Processing status in the warehouse. Fully eligible for immediate cancellation.'
  }
};

// Global in-memory store (persists during runtime in memory)
let activeOrders: Record<string, Order> = JSON.parse(JSON.stringify(SEED_ORDERS));

/**
 * Normalizes user speech input to canonical Order ID format (ORD-XXX).
 * Handles spoken forms:
 * - "ORD-101", "ord 101", "order 101"
 * - "one zero one", "one hundred one"
 * - "o r d 101"
 */
export function normalizeOrderId(rawInput: string | null | undefined): string | null {
  if (!rawInput) return null;

  let text = String(rawInput).trim().toLowerCase();

  // Convert spoken word numbers to digits
  const wordToNumMap: Record<string, string> = {
    'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
    'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9'
  };

  for (const [word, digit] of Object.entries(wordToNumMap)) {
    text = text.replace(new RegExp(`\\b${word}\\b`, 'g'), digit);
  }

  // Remove spaces between single digits (e.g., "1 0 1" -> "101")
  text = text.replace(/(\d)\s+(\d)/g, '$1$2').replace(/(\d)\s+(\d)/g, '$1$2');

  // Match pattern like "ord-101", "ord 101", "ord101", "order 101", "ord 104"
  const ordMatch = text.match(/(?:ord|order)[\s\-_]*(\d{3,5})/i);
  if (ordMatch) {
    return `ORD-${ordMatch[1]}`;
  }

  // Match isolated 3 to 5-digit order number (e.g. "101", "102", "103", "104")
  const digitMatch = text.match(/\b(10[1-9]|1[1-9]\d|[2-9]\d{2}|\d{4,5})\b/);
  if (digitMatch) {
    return `ORD-${digitMatch[1]}`;
  }

  return null;
}

/**
 * Deterministic Order Query Tool
 */
export function getOrderDetails(orderIdRaw: string) {
  const canonicalId = normalizeOrderId(orderIdRaw);

  if (!canonicalId || !activeOrders[canonicalId]) {
    return {
      found: false,
      error: 'ORDER_NOT_FOUND',
      searchedId: orderIdRaw,
      canonicalId: canonicalId,
      message: `I could not locate an order matching "${orderIdRaw}". Could you please verify the order ID? It should look like ORD-101.`
    };
  }

  const order = activeOrders[canonicalId];
  return {
    found: true,
    orderId: order.orderId,
    customerName: order.customerName,
    product: order.product,
    value: order.value,
    status: order.status,
    carrier: order.carrier,
    trackingNumber: order.trackingNumber,
    estimatedDelivery: order.estimatedDelivery,
    deliveredDate: order.deliveredDate,
    daysSinceDelivery: order.daysSinceDelivery,
    notes: order.notes,
    canCancel: order.canCancel,
    canReturn: order.canReturn,
    policyNotes: order.policyNotes
  };
}

/**
 * Deterministic Order Cancellation Tool
 */
export function cancelOrder(orderIdRaw: string) {
  const canonicalId = normalizeOrderId(orderIdRaw);

  if (!canonicalId || !activeOrders[canonicalId]) {
    return {
      success: false,
      error: 'ORDER_NOT_FOUND',
      message: `Cannot cancel: Order "${orderIdRaw}" was not found in our database.`
    };
  }

  const order = activeOrders[canonicalId];

  // Strictly enforce brand cancellation policy in code
  if (order.status === 'Processing') {
    order.status = 'Cancelled';
    order.canCancel = false;
    order.notes = `Cancelled by customer via voice agent on ${new Date().toLocaleTimeString('en-IN')}`;
    order.updatedAt = new Date().toISOString();

    return {
      success: true,
      orderId: order.orderId,
      status: 'Cancelled',
      message: `Order ${order.orderId} for ${order.product} has been successfully cancelled. Since this was in Processing, no delivery will be made, and any payment refund will reflect in 5 to 7 business days.`
    };
  }

  if (order.status === 'Out for Delivery' || order.status === 'Shipped') {
    return {
      success: false,
      error: 'POLICY_VIOLATION_CANNOT_CANCEL_DISPATCHED',
      orderId: order.orderId,
      status: order.status,
      message: `Order ${order.orderId} is currently ${order.status} with ${order.carrier || 'the courier'}. Under Aura Skincare policy, orders cannot be cancelled once dispatched. Please advise the customer to politely refuse delivery at the doorstep when the courier arrives.`
    };
  }

  if (order.status === 'Delivered') {
    return {
      success: false,
      error: 'POLICY_VIOLATION_ALREADY_DELIVERED',
      orderId: order.orderId,
      status: order.status,
      message: `Order ${order.orderId} has already been delivered. It cannot be cancelled. The customer may request a return within 7 days if the item is unopened and unused.`
    };
  }

  return {
    success: false,
    error: 'CANNOT_CANCEL',
    message: `Order ${order.orderId} is currently in "${order.status}" status and cannot be cancelled.`
  };
}

/**
 * Creates and stores a manual order in the live database
 */
export function createOrder(data: {
  orderId?: string;
  customerName: string;
  product: string;
  value: number;
  status: OrderStatus;
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  deliveredDate?: string;
  daysSinceDelivery?: number;
  notes?: string;
}): { success: boolean; order?: Order; error?: string; message?: string } {
  let orderId = data.orderId ? normalizeOrderId(data.orderId) : null;

  // Auto-generate next order ID if not specified or invalid
  if (!orderId) {
    const existingNums = Object.keys(activeOrders)
      .map(id => parseInt(id.replace(/\D/g, ''), 10))
      .filter(n => !isNaN(n));
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 104;
    orderId = `ORD-${nextNum}`;
  }

  const status = data.status || 'Processing';
  const canCancel = status === 'Processing';
  const daysSince = data.daysSinceDelivery !== undefined ? Number(data.daysSinceDelivery) : (status === 'Delivered' ? 3 : undefined);
  const canReturn = status === 'Delivered' && (daysSince !== undefined ? daysSince <= 7 : true);

  let policyNotes = '';
  if (status === 'Processing') {
    policyNotes = 'Order is in Processing status in the warehouse. Fully eligible for immediate cancellation.';
  } else if (status === 'Out for Delivery' || status === 'Shipped') {
    policyNotes = `Dispatched with ${data.carrier || 'courier'}. Policy strictly forbids cancellation once dispatched. If customer refuses, advise doorstep delivery refusal.`;
  } else if (status === 'Delivered') {
    if (daysSince !== undefined && daysSince > 7) {
      policyNotes = `Delivered ${daysSince} days ago. Aura policy requires returns within 7 days for unopened products. Return request must be politely declined.`;
    } else {
      policyNotes = `Delivered ${daysSince || 1} day(s) ago. Within 7-day return window for unopened products.`;
    }
  } else if (status === 'Cancelled') {
    policyNotes = 'Order has been cancelled. No dispatch or fulfillment will take place.';
  }

  const newOrder: Order = {
    orderId,
    customerName: data.customerName?.trim() || 'Valued Customer',
    product: data.product?.trim() || 'Aura Organic Botanical Blend',
    value: Number(data.value) || 699,
    status,
    carrier: data.carrier || (status === 'Processing' ? 'Unassigned (Warehouse)' : 'BlueDart'),
    trackingNumber: data.trackingNumber || (status !== 'Processing' && status !== 'Cancelled' ? `BD-${Math.floor(100000 + Math.random() * 900000)}` : undefined),
    estimatedDelivery: data.estimatedDelivery || (status === 'Out for Delivery' ? 'Expected by 6 PM today' : (status === 'Shipped' ? 'Expected in 2 business days' : undefined)),
    deliveredDate: status === 'Delivered' ? (data.deliveredDate || `${daysSince || 3} days ago`) : undefined,
    daysSinceDelivery: status === 'Delivered' ? daysSince : undefined,
    notes: data.notes || `${data.carrier || 'Warehouse'} — Status: ${status}`,
    canCancel,
    canReturn,
    policyNotes,
    updatedAt: new Date().toISOString(),
  };

  activeOrders[orderId] = newOrder;

  return {
    success: true,
    order: newOrder,
    message: `Order ${orderId} created successfully for ${newOrder.customerName}. It is now live in the OMS and accessible by Aria on voice calls!`
  };
}

/**
 * Returns all active orders for UI dashboard
 */
export function getAllOrders(): Order[] {
  return Object.values(activeOrders);
}

/**
 * Resets the database to seed state
 */
export function resetOrderDatabase(): void {
  activeOrders = JSON.parse(JSON.stringify(SEED_ORDERS));
}
