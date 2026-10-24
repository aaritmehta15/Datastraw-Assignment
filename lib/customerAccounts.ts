import { CustomerProfile, OrderStatus } from './types';
import { createOrder, getOrderDetails } from './orderDatabase';

export interface ExtendedCustomerAccount extends CustomerProfile {
  phone: string;
  orderProduct?: string;
  orderStatus?: OrderStatus;
  orderNotes?: string;
  isCustom?: boolean;
}

export const SEED_CUSTOMERS: ExtendedCustomerAccount[] = [
  {
    id: 'cust-101',
    name: 'Priya Sharma',
    email: 'priya.sharma@aura.in',
    phone: '+91 98201 44321',
    tier: 'Gold Member',
    activeOrderId: 'ORD-101',
    orderProduct: 'Vitamin C Serum (30ml)',
    orderStatus: 'Out for Delivery',
    orderNotes: 'Dispatched with BlueDart (BD-982103). Expected by 6 PM today.'
  },
  {
    id: 'cust-102',
    name: 'Rahul Verma',
    email: 'rahul.verma@aura.in',
    phone: '+91 97112 55901',
    tier: 'Silver Member',
    activeOrderId: 'ORD-102',
    orderProduct: 'Hydrating Sunscreen SPF 50',
    orderStatus: 'Delivered',
    orderNotes: 'Delivered 14 days ago via Delhivery (DL-441029). Past 7-day return window.'
  },
  {
    id: 'cust-103',
    name: 'Ananya Patel',
    email: 'ananya.patel@aura.in',
    phone: '+91 99304 88120',
    tier: 'Gold Member',
    activeOrderId: 'ORD-103',
    orderProduct: 'Green Tea Face Wash + Toner',
    orderStatus: 'Processing',
    orderNotes: 'Placed 3 hours ago. Currently in warehouse queue, eligible for cancellation.'
  },
  {
    id: 'guest',
    name: 'Guest Caller',
    email: 'guest@auraskin.com',
    phone: '+91 (Unverified)',
    tier: 'First-Time Customer',
    activeOrderId: undefined,
    orderProduct: undefined,
    orderStatus: undefined,
    orderNotes: 'No active orders on file. First-time browsing customer.'
  }
];

const LOCAL_STORAGE_KEY = '__AURA_CUSTOMER_ACCOUNTS__';
const ACTIVE_CUSTOMER_KEY = '__AURA_ACTIVE_CUSTOMER_ID__';

/**
 * Gets all available customer accounts (Seed + Custom from LocalStorage)
 */
export function getAvailableCustomers(): ExtendedCustomerAccount[] {
  if (typeof window === 'undefined') {
    return SEED_CUSTOMERS;
  }

  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) {
      return SEED_CUSTOMERS;
    }
    const parsed: ExtendedCustomerAccount[] = JSON.parse(stored);
    // Merge: seed customers first, then custom
    const customOnly = parsed.filter(c => c.isCustom);
    return [...SEED_CUSTOMERS, ...customOnly];
  } catch (err) {
    console.warn('Failed to read customer accounts from localStorage:', err);
    return SEED_CUSTOMERS;
  }
}

/**
 * Gets the current active customer from LocalStorage (defaults to Priya Sharma)
 */
export function getActiveCustomer(): ExtendedCustomerAccount {
  if (typeof window === 'undefined') {
    return SEED_CUSTOMERS[0];
  }

  try {
    const activeId = localStorage.getItem(ACTIVE_CUSTOMER_KEY);
    const list = getAvailableCustomers();
    const found = list.find(c => c.id === activeId);
    return found || SEED_CUSTOMERS[0];
  } catch (err) {
    return SEED_CUSTOMERS[0];
  }
}

/**
 * Sets the active customer ID in LocalStorage and dispatches an event
 */
export function setActiveCustomer(customer: ExtendedCustomerAccount): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(ACTIVE_CUSTOMER_KEY, customer.id);
    window.dispatchEvent(new CustomEvent('aura:customer-changed', { detail: customer }));
  } catch (err) {
    console.error('Failed to set active customer:', err);
  }
}

/**
 * Logs in a customer by Email, Phone, or ID
 */
export function loginCustomer(identifier: string): ExtendedCustomerAccount | null {
  const query = identifier.trim().toLowerCase();
  const list = getAvailableCustomers();
  const match = list.find(c =>
    c.id.toLowerCase() === query ||
    c.email.toLowerCase() === query ||
    c.phone.replace(/\D/g, '') === query.replace(/\D/g, '') ||
    c.name.toLowerCase() === query
  );

  if (match) {
    setActiveCustomer(match);
    return match;
  }
  return null;
}

/**
 * Logs out the active customer and sets status to Guest
 */
export function logoutCustomer(): ExtendedCustomerAccount {
  const guest = SEED_CUSTOMERS.find(c => c.id === 'guest') || {
    id: 'guest',
    name: 'Guest Caller',
    email: 'guest@auraskin.com',
    phone: '+91 (Unverified)',
    tier: 'First-Time Customer'
  };
  setActiveCustomer(guest);
  return guest;
}

/**
 * Returns true if customer is authenticated (not guest)
 */
export function isCustomerAuthenticated(customer?: ExtendedCustomerAccount | null): boolean {
  if (!customer) return false;
  return customer.id !== 'guest' && customer.name !== 'Guest Caller';
}

/**
 * Creates a new custom dummy account and syncs it with the live OMS
 */
export function createCustomerAccount(params: {
  name: string;
  email: string;
  phone?: string;
  tier?: 'Gold Member' | 'Silver Member' | 'First-Time Customer';
  createOrder?: boolean;
  product?: string;
  orderStatus?: OrderStatus;
  daysSinceDelivery?: number;
}): ExtendedCustomerAccount {
  const id = `cust-${Date.now().toString().slice(-4)}`;
  const tier = params.tier || 'Gold Member';
  const name = params.name.trim();
  const email = params.email.trim();
  const phone = params.phone?.trim() || '+91 98000 00000';

  let activeOrderId: string | undefined = undefined;
  let orderProduct: string | undefined = undefined;
  let orderStatus: OrderStatus | undefined = undefined;
  let orderNotes: string | undefined = undefined;

  if (params.createOrder) {
    const product = params.product || 'Ceramide Barrier Cream';
    const status = params.orderStatus || 'Processing';
    const daysSince = params.daysSinceDelivery !== undefined ? params.daysSinceDelivery : (status === 'Delivered' ? 1 : undefined);

    const orderRes = createOrder({
      customerName: name,
      product,
      value: 749,
      status,
      daysSinceDelivery: daysSince,
      carrier: status === 'Processing' ? 'Unassigned (Warehouse)' : 'BlueDart',
      estimatedDelivery: status === 'Out for Delivery' ? 'Expected by 6 PM today' : undefined
    });

    if (orderRes.success && orderRes.order) {
      activeOrderId = orderRes.order.orderId;
      orderProduct = orderRes.order.product;
      orderStatus = orderRes.order.status;
      orderNotes = orderRes.order.notes;
    }
  }

  const newAccount: ExtendedCustomerAccount = {
    id,
    name,
    email,
    phone,
    tier,
    activeOrderId,
    orderProduct,
    orderStatus,
    orderNotes,
    isCustom: true
  };

  if (typeof window !== 'undefined') {
    try {
      const all = getAvailableCustomers();
      const updated = [...all, newAccount];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      setActiveCustomer(newAccount);
    } catch (err) {
      console.error('Failed to save custom customer:', err);
    }
  }

  return newAccount;
}

/**
 * Generates personalized voice greeting for the active customer
 */
export function getCustomerPersonalizedGreeting(customer?: ExtendedCustomerAccount | CustomerProfile | null): string {
  if (!customer || customer.id === 'guest' || !customer.name || customer.name === 'Guest Caller') {
    return 'Namaste! I am Aria from Aura Skincare. How can I help you with your orders, products, or brand policies today?';
  }

  const firstName = customer.name.split(' ')[0];

  if (customer.activeOrderId) {
    const orderDetails = getOrderDetails(customer.activeOrderId);
    if (orderDetails.found) {
      if (orderDetails.status === 'Out for Delivery') {
        return `Namaste ${firstName}! Thank you for calling Aura Skincare. I see your order for the ${orderDetails.product} is out for delivery today. How can I assist you?`;
      }
      if (orderDetails.status === 'Processing') {
        return `Namaste ${firstName}! Thank you for calling Aura Skincare. I see your order for the ${orderDetails.product} is currently processing at our warehouse. How may I help you today?`;
      }
      if (orderDetails.status === 'Delivered') {
        return `Namaste ${firstName}! Thank you for calling Aura Skincare. I see your order for the ${orderDetails.product} was recently delivered. How can I help you today?`;
      }
    }
  }

  return `Namaste ${firstName}! Thank you for calling Aura Skincare. How may I assist you with your skincare routine or orders today?`;
}
