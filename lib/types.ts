// TypeScript domain models for Aura Skincare Voice CX Platform

export type OrderStatus = 'Processing' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled';

export interface Order {
  orderId: string;
  customerName: string;
  product: string;
  value: number; // in INR
  status: OrderStatus;
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  deliveredDate?: string;
  daysSinceDelivery?: number;
  notes: string;
  canCancel: boolean;
  canReturn: boolean;
  policyNotes: string;
  updatedAt?: string;
}

export interface BrandPolicy {
  id: string;
  category: 'shipping' | 'returns' | 'cancellations' | 'payments';
  title: string;
  summary: string;
  details: string[];
}

export interface CallTranscriptTurn {
  id: string;
  speaker: 'customer' | 'aria';
  text: string;
  timestamp: string;
  toolCalls?: {
    toolName: string;
    params: Record<string, any>;
    result: Record<string, any>;
  }[];
}

export interface ProductItem {
  id: string;
  name: string;
  price: number;
  category: string;
  size: string;
  ingredients: string;
  keyBenefits: string[];
  usageTip: string;
}

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  tier: 'Gold Member' | 'Silver Member' | 'First-Time Customer';
  activeOrderId?: string;
}

export interface StructuredCallSummary {
  customer_intent: 'ORDER_TRACKING' | 'CANCELLATION' | 'RETURN_REFUND' | 'POLICY_INQUIRY' | 'OUT_OF_SCOPE' | 'GENERAL_QUERY';
  order_id: string | null;
  resolution_status: 'RESOLVED' | 'DENIED_POLICY_LIMITATION' | 'INFO_PROVIDED' | 'ESCALATED' | 'UNRESOLVED';
  call_summary: string;
  customer_sentiment?: 'SATISFIED' | 'NEUTRAL' | 'FRUSTRATED';
  policy_compliance_notes?: string;
  timestamp?: string;
  duration_seconds?: number;
}
