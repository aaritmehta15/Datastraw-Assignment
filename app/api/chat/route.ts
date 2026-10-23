import { NextRequest, NextResponse } from 'next/server';
import { getOrderDetails, cancelOrder, getAllOrders, normalizeOrderId } from '@/lib/orderDatabase';
import { normalizeTextForVoice } from '@/lib/voiceNormalizer';
import { AURA_BRAND_OVERVIEW, BRAND_POLICIES } from '@/lib/brandKnowledge';

const SYSTEM_PROMPT = `You are Aria, an intelligent, empathetic, and professional Indian customer support specialist for Aura Skincare—a premium Indian organic skincare brand.

AURA SKINCARE BRAND & POLICY RULES (STRICT):
1. SHIPPING:
   - Free delivery on orders above ₹499.
   - Orders below ₹499 have a ₹50 shipping fee.
   - Standard delivery takes 3 to 5 business days via BlueDart and Delhivery.
2. RETURN & REFUND POLICY:
   - Returns are accepted strictly within 7 days of delivery.
   - MUST be unopened, unused, with safety seal intact in original packaging.
   - Opened or used products CANNOT be returned for hygiene reasons.
   - Damaged or defective items upon delivery must be reported within 48 hours with photos for replacement.
3. CANCELLATION POLICY:
   - Orders can be cancelled ONLY while their status is "Processing".
   - Once an order is "Shipped" or "Out for Delivery", it CANNOT be cancelled in the system. The customer MUST politely refuse delivery when the courier arrives at the doorstep.
4. CASH ON DELIVERY (COD):
   - Available for orders up to ₹2,500.
   - Customers can pay via Cash or UPI QR scan at the doorstep.
5. OUT OF SCOPE:
   - Only assist with Aura Skincare products, policies, and orders. Politely decline out-of-scope requests (e.g., flight booking, weather, outside products).

VOICE-FIRST COMMUNICATION RULES:
- Keep answers concise and natural for spoken audio (maximum 2 to 3 sentences).
- Do NOT use markdown symbols, bullet points, headers, or asterisks.
- Pronounce currency as "Rupees" (never write ₹).
- Pronounce Order IDs clearly (e.g., "Order O-R-D 101").
- If the customer asks about an order without providing an order ID, politely ask for their 6-character order ID (like ORD-101).
- If an order ID is provided, ALWAYS call the relevant tool (get_order_details or cancel_order) before answering.
- Never promise anything outside the stated brand policies.

TOOLS AVAILABLE:
- get_order_details(order_id: string): Look up real-time status and policy info for an order.
- cancel_order(order_id: string): Attempt cancellation for an order.
`;

const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'get_order_details',
      description: 'Retrieve real-time order information and policy eligibility from Aura Skincare database.',
      parameters: {
        type: 'object',
        properties: {
          order_id: {
            type: 'string',
            description: 'The order identifier, e.g. ORD-101, ORD-102, ORD-103'
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
function handleDeterministicFallback(userMessage: string, history: any[]) {
  const lower = userMessage.toLowerCase();
  const extractedOrderId = normalizeOrderId(userMessage);

  // Out of scope check
  if (lower.includes('flight') || lower.includes('goa') || lower.includes('weather') || lower.includes('cricket') || lower.includes('hotel')) {
    return {
      message: "I can only assist with Aura Skincare orders, products, and brand policies. Is there anything regarding your skincare order I can help you with today?",
      toolCalls: []
    };
  }

  // Cancellation intent
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
        message: "I can certainly check cancellation options for you. Could you please provide your order ID, such as ORD-101 or ORD-103?",
        toolCalls: []
      };
    }
  }

  // Return / Refund intent
  if (lower.includes('return') || lower.includes('refund')) {
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
          message: `I checked order ${details.orderId} for your ${details.product}. It was delivered ${details.daysSinceDelivery} days ago. Our policy allows returns within 7 days for unopened products, so unfortunately this order is no longer eligible for a return.`,
          toolCalls
        };
      }
      return {
        message: `For order ${details.orderId}, our policy allows returns within 7 days of delivery for unopened and unused items in original packaging.`,
        toolCalls
      };
    } else {
      return {
        message: "Aura Skincare accepts returns within 7 days of delivery for unopened, unused products in original packaging. Do you have an order ID you would like me to check?",
        toolCalls: []
      };
    }
  }

  // Order status / tracking intent
  if (extractedOrderId || lower.includes('where is') || lower.includes('track') || lower.includes('status')) {
    if (extractedOrderId) {
      const details = getOrderDetails(extractedOrderId);
      const toolCalls = [{ toolName: 'get_order_details', params: { order_id: extractedOrderId }, result: details }];

      if (!details.found) {
        return {
          message: `I could not find an order with the number ${extractedOrderId}. Could you please double check your order confirmation email and verify the ID?`,
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
        message: "I would be happy to track your order for you. Could you please share your order ID, for example ORD-101?",
        toolCalls: []
      };
    }
  }

  // Policy inquiries (shipping, COD)
  if (lower.includes('shipping') || lower.includes('delivery')) {
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

  // Greeting
  return {
    message: "Namaste! I am Aria from Aura Skincare. How can I assist you with your orders or brand questions today?",
    toolCalls: []
  };
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const { messages, userMessage } = await req.json();

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

        const formattedMessages = [
          { role: 'system', content: SYSTEM_PROMPT },
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
      const fallback = handleDeterministicFallback(latestUserMessage, conversation);
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
