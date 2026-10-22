import { BrandPolicy } from './types';

export const AURA_BRAND_OVERVIEW = {
  name: 'Aura Skincare',
  tagline: 'Pure, Organic Botanical Skincare Thoughtfully Formulated in India',
  description: 'Aura Skincare is a premium organic Indian skincare brand focused on simple, effective skincare products made with thoughtfully selected botanicals and clean ingredients.',
  agentPersona: {
    name: 'Aria',
    title: 'Customer Support Specialist',
    tone: 'Warm, professional, concise, empathetic Indian specialist',
    language: 'Indian English (with natural Hinglish comprehension)',
    guidelines: [
      'Be concise and conversational. Voice responses must not exceed 2-3 spoken sentences.',
      'Never read out markdown symbols, asterisks, or bullet points over audio.',
      'Pronounce currency as "Rupees", not symbol glyphs.',
      'Pronounce order IDs clearly (e.g., "Order O-R-D 101").',
      'Strictly enforce brand policies—never agree to refund opened products or cancel orders already out for delivery.',
      'If customer mumbles or information is missing, ask politely for clarification rather than guessing.'
    ]
  }
};

export const BRAND_POLICIES: BrandPolicy[] = [
  {
    id: 'shipping',
    category: 'shipping',
    title: 'Shipping & Delivery Policy',
    summary: 'Free delivery on orders above ₹499. Below ₹499 has a ₹50 shipping fee. Delivery in 3–5 business days.',
    details: [
      'Free shipping applies to all orders with total value ₹499 or higher.',
      'Orders below ₹499 incur a flat ₹50 shipping and handling fee.',
      'Standard delivery timeline across India is 3 to 5 business days via trusted carriers like BlueDart and Delhivery.',
      'Expedited dispatch occurs within 24 hours of order placement.'
    ]
  },
  {
    id: 'returns',
    category: 'returns',
    title: 'Return & Refund Policy',
    summary: 'Returns accepted within 7 days of delivery for UNOPENED, UNUSED items in original packaging. 48h defect window.',
    details: [
      'Returns are accepted strictly within 7 calendar days of delivery.',
      'Products must be unopened, unused, with safety seals intact, and in original packaging.',
      'Opened or used skincare products cannot be returned for hygiene and safety reasons.',
      'Damaged or defective items upon delivery must be reported within 48 hours with photographic proof for instant replacement or refund.',
      'Refunds are processed to the original payment method within 5–7 business days upon receipt and inspection at our warehouse.'
    ]
  },
  {
    id: 'cancellations',
    category: 'cancellations',
    title: 'Order Cancellation Policy',
    summary: 'Cancellations allowed ONLY while status is "Processing". Once Shipped or Out for Delivery, refuse at doorstep.',
    details: [
      'Orders can be immediately cancelled online or via customer support ONLY while their status is "Processing".',
      'Once an order transitions to "Shipped" or "Out for Delivery", it is dispatched with the courier and CANNOT be cancelled in our system.',
      'Customers who no longer wish to receive a dispatched package are advised to politely refuse delivery when the courier arrives at their doorstep.'
    ]
  },
  {
    id: 'payments',
    category: 'payments',
    title: 'Cash on Delivery (COD) & Payments',
    summary: 'COD available for orders up to ₹2,500. Pay by Cash or UPI at doorstep.',
    details: [
      'Cash on Delivery is supported for all domestic orders up to a maximum value of ₹2,500.',
      'For orders exceeding ₹2,500, prepaid payment via UPI, Credit/Debit card, or Net Banking is required.',
      'Doorstep payments on COD orders can be completed via cash or scan-and-pay UPI QR code provided by the delivery associate.'
    ]
  }
];
