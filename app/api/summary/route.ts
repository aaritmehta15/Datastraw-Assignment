import { NextRequest, NextResponse } from 'next/server';
import { StructuredCallSummary, CallTranscriptTurn } from '@/lib/types';
import { normalizeOrderId } from '@/lib/orderDatabase';

export async function POST(req: NextRequest) {
  try {
    const { transcript, durationSeconds } = await req.json();

    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'EMPTY_TRANSCRIPT',
        message: 'Transcript is required to generate a call summary.'
      }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    let summary: StructuredCallSummary | null = null;

    // Build plain text dialog
    const conversationText = transcript
      .map((t: CallTranscriptTurn) => `${t.speaker.toUpperCase()}: ${t.text}`)
      .join('\n');

    if (groqKey || geminiKey || openaiKey) {
      try {
        let baseURL = 'https://api.openai.com/v1';
        let apiKey = openaiKey || '';
        let model = 'gpt-4o-mini';

        if (groqKey) {
          baseURL = 'https://api.groq.com/openai/v1';
          apiKey = groqKey;
          model = 'llama-3.3-70b-versatile';
        } else if (geminiKey) {
          baseURL = 'https://generativelanguage.googleapis.com/v1beta/openai/';
          apiKey = geminiKey;
          model = 'gemini-2.5-flash';
        }

        const prompt = `Analyze this customer support call transcript for Aura Skincare and return a valid JSON object matching this schema:
{
  "customer_intent": "ORDER_TRACKING" | "CANCELLATION" | "RETURN_REFUND" | "POLICY_INQUIRY" | "OUT_OF_SCOPE" | "GENERAL_QUERY",
  "order_id": string or null (e.g. "ORD-101"),
  "resolution_status": "RESOLVED" | "DENIED_POLICY_LIMITATION" | "INFO_PROVIDED" | "ESCALATED" | "UNRESOLVED",
  "call_summary": "Concise 1-2 sentence executive summary of the conversation and outcome.",
  "customer_sentiment": "SATISFIED" | "NEUTRAL" | "FRUSTRATED",
  "policy_compliance_notes": "Brief note on brand policy adherence during the call."
}

TRANSCRIPT:
${conversationText}

Respond ONLY with valid JSON. No markdown backticks or commentary.`;

        const res = await fetch(`${baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1
          })
        });

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content || '{}';
          const cleaned = content.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
          summary = JSON.parse(cleaned);
        }
      } catch (err) {
        console.warn('Cloud LLM summary generation failed, using heuristic engine:', err);
      }
    }

    // Deterministic Heuristic Fallback
    if (!summary) {
      const allText = conversationText.toLowerCase();

      // Detect Order ID
      let detectedOrderId: string | null = null;
      for (const turn of transcript) {
        const id = normalizeOrderId(turn.text);
        if (id) {
          detectedOrderId = id;
          break;
        }
      }

      // Detect Intent
      let intent: StructuredCallSummary['customer_intent'] = 'GENERAL_QUERY';
      let status: StructuredCallSummary['resolution_status'] = 'RESOLVED';
      let summaryText = '';
      let sentiment: StructuredCallSummary['customer_sentiment'] = 'SATISFIED';
      let policyNotes = 'Aura Skincare brand policies were followed.';

      if (allText.includes('cancel')) {
        intent = 'CANCELLATION';
        if (detectedOrderId === 'ORD-103' || allText.includes('successfully cancelled')) {
          status = 'RESOLVED';
          summaryText = `Customer requested cancellation for order ${detectedOrderId || 'ORD-103'}. The order was in Processing and was successfully cancelled.`;
          policyNotes = 'Cancellation permitted as order status was Processing.';
        } else if (detectedOrderId === 'ORD-101' || allText.includes('cannot cancel')) {
          status = 'DENIED_POLICY_LIMITATION';
          summaryText = `Customer requested cancellation for order ${detectedOrderId || 'ORD-101'}. Request was politely denied as the order is Out for Delivery with BlueDart; doorstep refusal advised.`;
          sentiment = 'NEUTRAL';
          policyNotes = 'Dispatched order cancellation denied per policy; doorstep refusal advised.';
        }
      } else if (allText.includes('return') || allText.includes('refund')) {
        intent = 'RETURN_REFUND';
        if (detectedOrderId === 'ORD-102') {
          status = 'DENIED_POLICY_LIMITATION';
          summaryText = 'Customer requested a return for order ORD-102. Request was declined as delivery occurred 14 days ago, exceeding the 7-day policy window.';
          sentiment = 'NEUTRAL';
          policyNotes = '7-day return window strictly enforced for delivered items.';
        } else {
          status = 'INFO_PROVIDED';
          summaryText = 'Customer inquired about Aura Skincare return and refund terms. 7-day unopened return policy was explained.';
        }
      } else if (allText.includes('track') || allText.includes('where is') || detectedOrderId) {
        intent = 'ORDER_TRACKING';
        status = 'RESOLVED';
        if (detectedOrderId === 'ORD-101') {
          summaryText = 'Customer asked about the delivery status of ORD-101. The order is out for delivery with BlueDart and expected by 6 PM today.';
        } else if (detectedOrderId === 'ORD-102') {
          summaryText = 'Customer checked status of ORD-102. Agent confirmed order was delivered 14 days ago via Delhivery.';
        } else if (detectedOrderId === 'ORD-103') {
          summaryText = 'Customer checked status of ORD-103. Order is currently in Processing at the warehouse.';
        } else {
          summaryText = `Customer requested tracking for ${detectedOrderId || 'their order'}. Real-time fulfillment status was provided.`;
        }
      } else if (allText.includes('flight') || allText.includes('goa')) {
        intent = 'OUT_OF_SCOPE';
        status = 'INFO_PROVIDED';
        summaryText = 'Customer made an out-of-scope inquiry. Agent politely redirected focus to Aura Skincare inquiries.';
        sentiment = 'NEUTRAL';
      } else if (allText.includes('shipping') || allText.includes('cod')) {
        intent = 'POLICY_INQUIRY';
        status = 'INFO_PROVIDED';
        summaryText = 'Customer inquired about Aura Skincare shipping thresholds and COD availability.';
      } else {
        summaryText = 'Customer had a general support inquiry with Aria regarding Aura Skincare.';
      }

      summary = {
        customer_intent: intent,
        order_id: detectedOrderId,
        resolution_status: status,
        call_summary: summaryText,
        customer_sentiment: sentiment,
        policy_compliance_notes: policyNotes
      };
    }

    summary.timestamp = new Date().toISOString();
    summary.duration_seconds = durationSeconds || Math.round(transcript.length * 4.5);

    return NextResponse.json({
      success: true,
      summary
    });
  } catch (error: any) {
    console.error('Summary API error:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error?.message || 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
