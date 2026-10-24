import { NextRequest, NextResponse } from 'next/server';
import { getOrderDetails, cancelOrder, getAllOrders, normalizeOrderId, findOrderByCustomerName } from '@/lib/orderDatabase';
import { normalizeTextForVoice } from '@/lib/voiceNormalizer';
import { AURA_BRAND_OVERVIEW, BRAND_POLICIES, AURA_PRODUCT_CATALOG } from '@/lib/brandKnowledge';
import { CustomerProfile } from '@/lib/types';

const SYSTEM_PROMPT = `You are Aria, an intelligent, empathetic, and professional Indian customer support specialist for Aura Skincare—a premium Indian organic botanical skincare brand.

AURA SKINCARE BRAND & POLICY RULES (STRICT):
1. SHIPPING:
   - Free delivery on orders above ₹499.
   - Orders below ₹499 have a flat ₹50 shipping fee.
   - Standard delivery takes 3 to 5 business days via BlueDart and Delhivery.
2. RETURN & REFUND POLICY:
   - Returns are accepted strictly within 7 days of delivery.
   - Products MUST be unopened, unused, with safety seal intact in original packaging.
   - Opened or used products CANNOT be returned for hygiene reasons.
   - Direct product exchanges are NOT supported. Customers must return the unopened product within 7 days and place a new order on the website.
3. DAMAGED / DEFECTIVE PRODUCTS POLICY:
   - Damaged, defective, broken, or leaking items upon delivery MUST be reported within 48 hours of delivery with photographic proof.
   - When verified within 48 hours, Aura issues an immediate free replacement dispatch (or refund) without requiring the broken item to be shipped back.
   - Damage reports past 48 hours of delivery are strictly declined under transit policy.
4. CANCELLATION POLICY:
   - Orders can be cancelled ONLY while their status is "Processing".
   - Once an order is "Shipped" or "Out for Delivery", it CANNOT be cancelled in the system. The customer MUST politely refuse delivery when the courier arrives at the doorstep.
5. CASH ON DELIVERY (COD):
   - Available for orders up to ₹2,500.
   - Customers can pay via Cash or UPI QR scan at the doorstep.
6. OUT OF SCOPE:
   - Only assist with Aura Skincare products, policies, and orders. Politely decline out-of-scope requests (e.g., flight booking, weather, outside products).

AURA PRODUCT & INGREDIENT CATALOG:
1. Vitamin C Glow Serum (30ml, ₹699):
   - Active Ingredients: 15% Ethyl Ascorbic Acid, 0.5% Ferulic Acid, 1% Hyaluronic Acid, Orange Peel Extract.
   - Benefits: Fades dark spots and hyperpigmentation, stimulates collagen, provides environmental antioxidant defense.
   - How to use: Apply 3 to 4 drops every morning on clean skin before applying sunscreen.
2. Hydrating Sunscreen SPF 50 (50g, ₹499):
   - Active Ingredients: Broad Spectrum PA++++ UV filters, Ceramide NP, Centella Asiatica (Cica), 2% Niacinamide.
   - Benefits: Zero white cast, non-greasy dewy finish, strengthens skin moisture barrier.
   - How to use: Apply two finger lengths 15 minutes before sun exposure. Reapply every 2 to 3 hours.
3. Green Tea Face Wash + Toner (150ml, ₹850):
   - Active Ingredients: Organic Darjeeling Green Tea, 1% Salicylic Acid (BHA), Tea Tree Leaf Oil, Niacinamide.
   - Benefits: Deep pore purification, controls excess oil, balances skin pH, prevents acne breakouts.
   - How to use: Massage one pump onto damp face morning and night, then rinse with lukewarm water.
4. Kumkumadi Night Oil (15ml, ₹1299):
   - Active Ingredients: Kashmiri Saffron (Kumkuma), 24k Gold Bhasma, Sandalwood (Chandan), Lotus Stamen, Sesame Oil.
   - Benefits: Traditional Ayurvedic overnight nourishment, boosts elasticity, restores a luminous golden glow.
   - How to use: Warm 2 to 3 drops in clean palms and gently press into face and neck before bedtime.
5. Ceramide Barrier Cream (50g, ₹749):
   - Active Ingredients: 5 Essential Ceramides (EOP, NS, NP, AS, AP), Colloidal Oat Extract, Plant-derived Squalane.
   - Benefits: Repairs damaged skin barrier, soothes redness and irritation, locks in 72-hour deep moisture.
   - How to use: Smooth over face and neck as the final moisturizer step in morning and evening routines.
6. Rosewater Balancing Mist (100ml, ₹399):
   - Active Ingredients: 100% Pure Steam-Distilled Kannauj Rose Petal Hydrosol, Aloe Barbadensis Leaf Juice.
   - Benefits: Instant mid-day hydration, calms irritation, primes skin for serums and moisturizers.
   - How to use: Mist generously over face anytime skin feels tight or dry.

VOICE-FIRST COMMUNICATION RULES:
- Keep answers concise and natural for spoken audio (maximum 2 to 3 sentences).
- Do NOT use markdown symbols, bullet points, headers, or asterisks.
- Pronounce currency as "Rupees" (never write ₹).
- Pronounce Order IDs clearly (e.g., "Order O-R-D 101").
- If the customer asks about an order without an ID, check if their profile has an active order or ask for their order ID or full name.
- Never promise anything outside the stated brand policies.

TOOLS AVAILABLE:
- get_order_details(order_id: string): Look up real-time status and policy info for an order by Order ID (ORD-101) or customer name (e.g. "Priya Sharma").
- cancel_order(order_id: string): Attempt cancellation for an order.
`;

const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'get_order_details',
      description: 'Retrieve real-time order information and policy eligibility from Aura Skincare database using Order ID (ORD-101) or customer name (Priya Sharma).',
      parameters: {
        type: 'object',
        properties: {
          order_id: {
            type: 'string',
            description: 'The order identifier (e.g. ORD-101, ORD-102, ORD-103) or customer name (e.g. Priya Sharma).'
          }
        },
        required: ['order_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'cancel_order',
      description: 'Cancel an order in the Aura Skincare database if eligible under policy (status must be Processing).',
      parameters: {
        type: 'object',
        properties: {
          order_id: {
            type: 'string',
            description: 'The order identifier to cancel, e.g. ORD-103'
          }
        },
        required: ['order_id']
      }
    }
  }
];

// Fallback deterministic logic when no API key is provided
function handleDeterministicFallback(
  userMessage: string,
  history: any[],
  customerProfile?: CustomerProfile | null
) {
  const lower = userMessage.toLowerCase();
  let extractedOrderId = normalizeOrderId(userMessage);

  // Check if customer name in user message maps to an order (e.g. "Priya Sharma", "Rahul", "Ananya")
  if (!extractedOrderId) {
    const matchedByName = findOrderByCustomerName(userMessage);
    if (matchedByName) {
      extractedOrderId = matchedByName.orderId;
    }
  }

  // If still no order ID mentioned, but active customer profile has a linked order
  if (!extractedOrderId && customerProfile?.activeOrderId) {
    extractedOrderId = customerProfile.activeOrderId;
  }

  // 1. Out of scope check
  if (lower.includes('flight') || lower.includes('goa') || lower.includes('weather') || lower.includes('cricket') || lower.includes('hotel') || lower.includes('movie')) {
    return {
      message: "I can only assist with Aura Skincare orders, organic products, and brand policies. Is there anything regarding your skincare order I can help you with today?",
      toolCalls: []
    };
  }

  // 2. Damaged / Defective / Broken bottle / Leaking item policy flow (48-hour transit policy)
  if (
    lower.includes('broken') ||
    lower.includes('damaged') ||
    lower.includes('leaking') ||
    lower.includes('leak') ||
    lower.includes('shattered') ||
    lower.includes('spilled') ||
    lower.includes('defective') ||
    lower.includes('cracked')
  ) {
    if (extractedOrderId) {
      const details = getOrderDetails(extractedOrderId);
      const toolCalls = [{ toolName: 'get_order_details', params: { order_id: extractedOrderId }, result: details }];

      if (details.found) {
        // If order was delivered more than 2 days ago (e.g. ORD-102 delivered 14 days ago)
        if (details.daysSinceDelivery && details.daysSinceDelivery > 2) {
          return {
            message: `I am very sorry your ${details.product} was damaged, however order ${details.orderId} was delivered ${details.daysSinceDelivery} days ago. Our transit damage policy strictly requires damages to be reported within 48 hours of delivery with photo proof, so we cannot issue a replacement at this stage.`,
            toolCalls
          };
        }

        // Within 48-hour window (or Out for Delivery today) -> Free instant replacement
        return {
          message: `I am so sorry to hear your ${details.product} arrived damaged for order ${details.orderId}! Under our 48-hour damaged product policy, we will arrange an immediate free replacement. Please email a quick photo of the damaged bottle to support@auraskin.com or WhatsApp us at 98765-43210, and we will dispatch your replacement today.`,
          toolCalls
        };
      }
    }

    return {
      message: "I am very sorry to hear your product arrived damaged! Under our 48-hour damaged product policy, we provide an immediate free replacement with photographic proof. Could you please share your order ID or full name so I can initiate your replacement?",
      toolCalls: []
    };
  }

  // 3. Product Exchange Policy Check (Direct exchanges not supported)
  if (lower.includes('exchange')) {
    return {
      message: "Under Aura Skincare policy, direct product exchanges are not supported. If your item is unopened, you can return it within 7 days of delivery for a refund and place a new order on our website.",
      toolCalls: []
    };
  }

  // 4. Product & Ingredient Consultations
  // Vitamin C Glow Serum
  if (lower.includes('vitamin c') || (lower.includes('serum') && !lower.includes('sunscreen') && !lower.includes('oil'))) {
    return {
      message: "Our Vitamin C Glow Serum contains 15% Ethyl Ascorbic Acid, 0.5% Ferulic Acid, and 1% Hyaluronic Acid with Orange Peel Extract. It brightens skin, fades dark spots, and protects against environmental damage. Apply 3 to 4 drops every morning on clean skin before applying sunscreen.",
      toolCalls: []
    };
  }

  // Sunscreen SPF 50
  if (lower.includes('sunscreen') || lower.includes('spf') || lower.includes('sun protection')) {
    return {
      message: "Our Hydrating Sunscreen SPF 50 provides Broad Spectrum PA++++ UV protection enriched with Ceramide NP, Centella Asiatica, and 2% Niacinamide. It leaves zero white cast and delivers a dewy, non-greasy finish. Apply two finger lengths 15 minutes before sun exposure.",
      toolCalls: []
    };
  }

  // Green Tea Face Wash / Cleanser / Acne
  if (lower.includes('face wash') || lower.includes('cleanser') || lower.includes('green tea') || lower.includes('acne') || lower.includes('oily skin')) {
    return {
      message: "Our Green Tea Face Wash + Toner contains Organic Darjeeling Green Tea, 1% Salicylic Acid BHA, and Tea Tree Leaf Oil. It purifies pores deeply, balances excess sebum, and prevents breakouts without drying the skin. Gently massage one pump onto wet skin morning and evening.",
      toolCalls: []
    };
  }

  // Kumkumadi Night Oil / Saffron / Face Oil / Elasticity
  if (lower.includes('kumkumadi') || lower.includes('night oil') || lower.includes('saffron') || lower.includes('anti-aging') || lower.includes('wrinkles')) {
    return {
      message: "Our Kumkumadi Night Oil is formulated with authentic Kashmiri Saffron, 24-karat Gold Bhasma, Sandalwood, and Lotus Stamen in Pure Sesame Oil. It delivers intensive Ayurvedic overnight radiance, firms skin elasticity, and restores a natural golden glow. Warm 2 to 3 drops in palms and press into skin before bedtime.",
      toolCalls: []
    };
  }

  // Ceramide Barrier Cream / Moisturizer / Dry skin / Redness
  if (lower.includes('ceramide') || lower.includes('barrier') || lower.includes('moisturizer') || lower.includes('dry skin') || lower.includes('peeling')) {
    return {
      message: "Our Ceramide Barrier Cream features 5 essential ceramides, Colloidal Oat Extract, and plant-derived Squalane. It deeply repairs compromised skin barriers, calms irritation, and locks in 72-hour moisture. Smooth over face and neck morning and night.",
      toolCalls: []
    };
  }

  // Rosewater Mist
  if (lower.includes('rose') || lower.includes('rosewater') || lower.includes('mist')) {
    return {
      message: "Our Rosewater Balancing Mist is made from 100% pure steam-distilled Kannauj rose petal hydrosol and Aloe Vera. It provides an instant soothing hydration boost and balances skin pH throughout the day.",
      toolCalls: []
    };
  }

  // General skincare catalog / routine inquiry
  if (lower.includes('products') || lower.includes('catalog') || lower.includes('routine') || lower.includes('ingredients')) {
    return {
      message: "Aura Skincare offers 6 organic botanical formulas: Vitamin C Glow Serum, Hydrating Sunscreen SPF 50, Green Tea Face Wash, Kumkumadi Night Oil, Ceramide Barrier Cream, and Rosewater Balancing Mist. Which product can I tell you more about?",
      toolCalls: []
    };
  }

  // 4. Cancellation intent
  if (lower.includes('cancel')) {
    if (extractedOrderId) {
      const result = cancelOrder(extractedOrderId);
      const toolCalls = [{ toolName: 'cancel_order', params: { order_id: extractedOrderId }, result }];

      return {
        message: result.message || `Order ${extractedOrderId} cancellation processed.`,
        toolCalls
      };
    } else {
      return {
        message: "I can certainly check cancellation options for you. Could you please provide your order ID, such as ORD-101 or ORD-103, or your full name?",
        toolCalls: []
      };
    }
  }

  // 5. Return / Refund / Exchange intent
  if (lower.includes('return') || lower.includes('refund') || lower.includes('exchange')) {
    if (lower.includes('exchange')) {
      return {
        message: "Under Aura Skincare policy, direct product exchanges are not supported. If your item is unopened, you can return it within 7 days of delivery for a refund and place a new order on our website.",
        toolCalls: []
      };
    }

    if (extractedOrderId) {
      const details = getOrderDetails(extractedOrderId);
      const toolCalls = [{ toolName: 'get_order_details', params: { order_id: extractedOrderId }, result: details }];

      if (!details.found) {
        return {
          message: `I could not locate an order matching ${extractedOrderId}. Could you please verify the order ID from your confirmation email?`,
          toolCalls
        };
      }

      if (details.daysSinceDelivery && details.daysSinceDelivery > 7) {
        return {
          message: `I checked order ${details.orderId} for your ${details.product}. It was delivered ${details.daysSinceDelivery} days ago. Our policy allows returns strictly within 7 days for unopened products, so unfortunately this order is no longer eligible for a return.`,
          toolCalls
        };
      }
      return {
        message: `For order ${details.orderId}, our policy allows returns within 7 days of delivery for unopened and unused items with original safety seals intact.`,
        toolCalls
      };
    } else {
      return {
        message: "Aura Skincare accepts returns within 7 days of delivery for unopened, unused products in original packaging. Do you have an order ID or full name you would like me to check?",
        toolCalls: []
      };
    }
  }

  // 6. Order status / tracking intent
  if (extractedOrderId || lower.includes('where is') || lower.includes('track') || lower.includes('status') || lower.includes('delivery')) {
    if (extractedOrderId) {
      const details = getOrderDetails(extractedOrderId);
      const toolCalls = [{ toolName: 'get_order_details', params: { order_id: extractedOrderId }, result: details }];

      if (!details.found) {
        return {
          message: `I could not find an order with the identifier ${extractedOrderId}. Could you please double check your order confirmation email and verify the ID?`,
          toolCalls
        };
      }

      let trackingPhrase = '';
      if (details.status === 'Out for Delivery') {
        trackingPhrase = `Your ${details.product} is currently out for delivery with ${details.carrier || 'BlueDart'} and is ${details.estimatedDelivery || 'expected today'}.`;
      } else if (details.status === 'Delivered') {
        trackingPhrase = `Your order ${details.orderId} for ${details.product} was delivered ${details.deliveredDate || 'recently'}${details.carrier ? ' via ' + details.carrier : ''}.`;
      } else if (details.status === 'Processing') {
        trackingPhrase = `Your order ${details.orderId} for ${details.product} is currently in Processing at our warehouse and is eligible for cancellation if needed.`;
      } else if (details.status === 'Cancelled') {
        trackingPhrase = `Order ${details.orderId} for ${details.product} was cancelled. No delivery will be made.`;
      } else {
        trackingPhrase = `Your order ${details.orderId} for ${details.product} is currently ${details.status}${details.carrier ? ' with ' + details.carrier : ''}.`;
      }

      return {
        message: `I located your order ${details.orderId} for ${details.customerName}. ${trackingPhrase}`,
        toolCalls
      };
    } else {
      return {
        message: "I would be happy to track your order for you. Could you please share your order ID, for example ORD-101, or your account name?",
        toolCalls: []
      };
    }
  }

  // 7. Policy inquiries (shipping, COD)
  if (lower.includes('shipping') || lower.includes('charge') || lower.includes('fee')) {
    return {
      message: "We offer free delivery across India on orders above 499 Rupees. For orders below that, there is a flat 50 Rupees shipping fee, and delivery takes 3 to 5 business days.",
      toolCalls: []
    };
  }

  if (lower.includes('cod') || lower.includes('cash on delivery') || lower.includes('upi') || lower.includes('payment')) {
    return {
      message: "Cash on delivery is available for orders up to 2,500 Rupees. You can pay by cash or scan a UPI QR code directly at your doorstep when the courier arrives.",
      toolCalls: []
    };
  }

  // Greeting personalized or default
  if (customerProfile && customerProfile.name && customerProfile.id !== 'guest') {
    const firstName = customerProfile.name.split(' ')[0];
    return {
      message: `Namaste ${firstName}! I am Aria from Aura Skincare. How can I assist you with your orders or skincare questions today?`,
      toolCalls: []
    };
  }

  return {
    message: "Namaste! I am Aria from Aura Skincare. How can I assist you with your orders or brand questions today?",
    toolCalls: []
  };
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const { messages, userMessage, customerProfile } = await req.json();

    const conversation = messages || [{ role: 'user', content: userMessage }];
    const latestUserMessage = userMessage || conversation[conversation.length - 1]?.content || '';

    // Check environment for LLM keys
    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    let responseMessage = '';
    let toolCallsExecuted: any[] = [];
    let llmProvider = 'deterministic-engine';

    if (groqKey || geminiKey || openaiKey) {
      try {
        let baseURL = 'https://api.openai.com/v1';
        let apiKey = openaiKey || '';
        let model = 'gpt-4o-mini';

        if (groqKey) {
          baseURL = 'https://api.groq.com/openai/v1';
          apiKey = groqKey;
          model = 'openai/gpt-oss-120b';
          llmProvider = 'groq-gpt-oss-120b';
        } else if (geminiKey) {
          baseURL = 'https://generativelanguage.googleapis.com/v1beta/openai/';
          apiKey = geminiKey;
          model = 'gemini-2.5-flash';
          llmProvider = 'gemini-2.5-flash';
        }

        let dynamicSystemPrompt = SYSTEM_PROMPT;
        if (customerProfile && customerProfile.id !== 'guest') {
          dynamicSystemPrompt += `\nCURRENT AUTHENTICATED CALLER PROFILE:\n- Name: ${customerProfile.name}\n- Membership: ${customerProfile.tier}\n- Email: ${customerProfile.email}\n- Active Order ID: ${customerProfile.activeOrderId || 'None'}\nIf the caller asks about their order or cancellation without specifying an ID, proactively verify against their active order ${customerProfile.activeOrderId || ''}.\n`;
        }

        const formattedMessages = [
          { role: 'system', content: dynamicSystemPrompt },
          ...conversation
        ];

        // Call LLM with tool definitions
        const initialRes = await fetch(`${baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages: formattedMessages,
            tools: TOOL_DEFINITIONS,
            tool_choice: 'auto',
            temperature: 0.3
          })
        });

        if (initialRes.ok) {
          const completionData = await initialRes.json();
          const choice = completionData.choices?.[0];
          const choiceMessage = choice?.message;

          // Check for Tool Calls
          if (choiceMessage?.tool_calls && choiceMessage.tool_calls.length > 0) {
            const toolCall = choiceMessage.tool_calls[0];
            const functionName = toolCall.function.name;
            const args = JSON.parse(toolCall.function.arguments || '{}');

            let toolResult: any = {};
            if (functionName === 'get_order_details') {
              toolResult = getOrderDetails(args.order_id);
            } else if (functionName === 'cancel_order') {
              toolResult = cancelOrder(args.order_id);
            }

            toolCallsExecuted.push({
              toolName: functionName,
              params: args,
              result: toolResult
            });

            // Follow-up completion passing tool result
            const followUpMessages = [
              ...formattedMessages,
              choiceMessage,
              {
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify(toolResult)
              }
            ];

            const secondRes = await fetch(`${baseURL}/chat/completions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                model,
                messages: followUpMessages,
                temperature: 0.3
              })
            });

            if (secondRes.ok) {
              const secondData = await secondRes.json();
              responseMessage = secondData.choices?.[0]?.message?.content || '';
            }
          } else {
            responseMessage = choiceMessage?.content || '';
          }
        }
      } catch (err) {
        console.warn('Cloud LLM call encountered an issue, falling back to deterministic engine:', err);
      }
    }

    // Fallback if cloud LLM wasn't called or produced empty response
    if (!responseMessage) {
      const fallback = handleDeterministicFallback(latestUserMessage, conversation, customerProfile);
      responseMessage = fallback.message;
      toolCallsExecuted = fallback.toolCalls;
    }

    // Normalize text for voice synthesis
    const voiceMessage = normalizeTextForVoice(responseMessage);
    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: voiceMessage,
      rawMessage: responseMessage,
      toolCalls: toolCallsExecuted,
      provider: llmProvider,
      durationMs,
      orders: getAllOrders()
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: "I am having a brief connection delay. How else may I assist you with your Aura Skincare order?",
        error: error?.message
      },
      { status: 500 }
    );
  }
}
