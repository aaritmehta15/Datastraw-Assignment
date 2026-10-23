# AURA SKINCARE — AI VOICE CX AGENT (ARIA)
## Master Production Implementation Plan & Engineering Specification

---

### Executive Overview & Strategic Intent
This document defines the end-to-end architectural blueprint, multi-page web suite specification, technical contracts, and phased development roadmap for **Aria**, the enterprise AI Voice Customer Experience (CX) Agent for **Aura Skincare**.

The objective is to produce a **hiring-grade, production-ready system** that satisfies every core requirement, implements the key "Beyond the Basics" capabilities (barge-in interruption, multi-tool state mutation, deterministic guardrails, low-latency synthesis, and regex entity normalization), and provides evaluators with a multi-page, visualizable operations console.

---

## 1. System Architecture & The 5 Core Pillars

```
                                      ┌────────────────────────────────────────────────────────┐
                                      │             CLIENT BROWSER (Next.js 15 / React 19)     │
                                      │                                                        │
 ┌───────────────────┐                │   ┌────────────────────────────────────────────────┐   │
 │   User Speaking   │ ──(Mic 16kHz)──┼──>│  Web Speech API (en-IN) / VAD Audio Listener   │   │
 └───────────────────┘                │   └──────────────────────┬─────────────────────────┘   │
                                      │                          │ Utterance Stream            │
                                      │                          ▼                             │
                                      │   ┌────────────────────────────────────────────────┐   │
 ┌───────────────────┐                │   │  AudioContext Reactive Waveform (Canvas 60fps) │   │
 │   User Hearing    │ <──(Audio Out)─┼───│  Active Barge-In Interrupt Controller          │   │
 └───────────────────┘                │   └──────────────────────▲─────────────────────────┘   │
                                      │                          │ Audio Buffer                │
                                      └──────────────────────────┼─────────────────────────────┘
                                                                 │
                                      ┌──────────────────────────┴─────────────────────────────┐
                                      │             SERVERLESS BACKEND (/api Routes)           │
                                      │                                                        │
                                      │   ┌────────────────────────────────────────────────┐   │
                                      │   │  1. Entity Normalizer & Regex Resolver         │   │
                                      │   │     ("order 101" -> "ORD-101")                 │   │
                                      │   └──────────────────────┬─────────────────────────┘   │
                                      │                          ▼                             │
                                      │   ┌────────────────────────────────────────────────┐   │
                                      │   │  2. Fast LLM Orchestrator (Groq / Gemini)       │   │
                                      │   │     Native Function Calling Engine             │   │
                                      │   └──────────────────────┬─────────────────────────┘   │
                                      │                          ▼                             │
                                      │   ┌────────────────────────────────────────────────┐   │
                                      │   │  3. Deterministic Policy Guardrail Engine       │   │
                                      │   │     (Code-Enforced Can_Cancel, Can_Return)     │   │
                                      │   └──────────────────────┬─────────────────────────┘   │
                                      │                          ▼                             │
                                      │   ┌────────────────────────────────────────────────┐   │
                                      │   │  4. Voice Phonetic Normalizer                  │   │
                                      │   │     (₹ -> Rupees, Acronyms, No Markdown)       │   │
                                      │   └──────────────────────┬─────────────────────────┘   │
                                      │                          ▼                             │
                                      │   ┌────────────────────────────────────────────────┐   │
                                      │   │  5. Enterprise Neural TTS (en-IN-NeerjaNeural) │   │
                                      │   │     Sub-300ms Audio Buffer Stream              │   │
                                      │   └────────────────────────────────────────────────┘   │
                                      └────────────────────────────────────────────────────────┘
```

### Pillar 1: The Voice Ingestion & Low-Latency Cadence
- **Speech Recognition (STT):** Browser-native `webkitSpeechRecognition` configured for `lang: 'en-IN'` providing 0ms local transcription and interim streaming output.
- **Voice Activity Detection (VAD):** Client-side speech boundary detection triggering immediate transitions between `Listening` $\to$ `Thinking`.
- **True Barge-In (Interruption):** Web Audio API listener continuously monitors microphone levels while Aria speaks. The moment user speech threshold is breached, ongoing audio playback is immediately stopped (`audio.pause()` / `bufferSource.stop()`) and the system flips back to `Listening`.

### Pillar 2: The Defensive Order & Guardrail Engine
- **Regex Normalizer:** Converts colloquial spoken strings (*"order one zero one"*, *"ORD 101"*, *"o r d 101"*) into canonical `ORD-101`.
- **Policy Lives in Code, Not the Prompt:** Tools do not return raw database rows. They compute deterministic business states:
  - `can_cancel`: `boolean` (strictly `true` only if `status === 'Processing'`).
  - `can_return`: `boolean` (strictly `true` only if delivered within 7 days and unopened).
  - `denial_reason`: String explanation detailing exact policy violations.
  - The LLM only phrases the result; it has zero authority to override policy rules.

### Pillar 3: Authentic Indian Voice Persona (Aria)
- **Neural Speech Synthesis:** Serverless streaming endpoint utilizing Microsoft Neural Voice (`en-IN-NeerjaNeural` or `en-IN-KavitaNeural`).
- **Phonetic Pre-processing:** Converts currency symbols (`₹499` $\to$ *"499 Rupees"*), order formats (`ORD-101` $\to$ *"Order O-R-D 101"*), and carrier names (*"Delhivery"*, *"BlueDart"*) into phonetic tokens.
- **Fail-Safe Fallback:** If cloud neural synthesis hits network latency, client automatically falls back to browser-level neural voices (`Google English India` / `Microsoft Heera`).

### Pillar 4: Post-Call CRM Intelligence & Telemetry
- Structured JSON output generated automatically upon call conclusion:
  - `customer_intent`: Enumerated category (`ORDER_TRACKING`, `CANCELLATION`, `RETURN_REFUND`, `POLICY_INQUIRY`, `OUT_OF_SCOPE`).
  - `order_id`: Extracted canonical ID or `null`.
  - `resolution_status`: `RESOLVED`, `DENIED_POLICY_LIMITATION`, `ESCALATED`, or `INFO_PROVIDED`.
  - `call_summary`: Executive 2-sentence summary.
  - `customer_sentiment`: `SATISFIED`, `NEUTRAL`, or `FRUSTRATED`.
  - `policy_adherence_verified`: Boolean audit confirmation.

### Pillar 5: Multi-Page Operations Console (Evaluator UX)
The evaluator is given a multi-page, luxury-themed D2C operations suite, not a single cramped landing page:
1. **`/` (Live Voice Studio):** The hero testing arena with audio waveform, live state badges, real-time transcript stream, and one-click evaluator scenario chips.
2. **`/orders` (Live Order Management System):** An interactive database dashboard displaying `ORD-101`, `ORD-102`, and `ORD-103`. As Aria cancels `ORD-103` on the call, the status badge here changes in real time from `Processing` to `Cancelled`!
3. **`/policies` (Aura Brand Knowledge Hub):** Comprehensive, searchable policy cards (Shipping, Returns, Cancellations, COD rules).
4. **`/analytics` (Call History & CRM Telemetry):** Archive of completed calls, inspectable JSON logs with 1-click clipboard copy, and latency benchmarks.
5. **`/architecture` (System Design & Evaluator Guide):** Interactive architecture diagrams, latency waterfall breakdown, and direct answers to Section 9 questions.

---

## 2. Mock Order Database & Deterministic State Matrix

```typescript
export interface Order {
  orderId: string;
  customerName: string;
  product: string;
  value: number; // in INR
  status: 'Processing' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  carrier?: string;
  trackingNumber?: string;
  deliveryDate?: string; // ISO date
  daysSinceDelivery?: number;
  isOpened?: boolean;
  notes: string;
  canCancel: boolean;
  canReturn: boolean;
  policyNotes: string;
}
```

### The 3 Core Test Scenarios:
1. **`ORD-101` (Priya Sharma — Vitamin C Serum ₹699):**
   - Status: `Out for Delivery` (BlueDart `BD-982103`, expected today by 6 PM).
   - Cancellation Request: **DENIED**. Policy strictly forbids cancelling shipped/out for delivery orders. Instruction: Advise customer to refuse delivery at doorstep.
   - Return Request: **DENIED**. Cannot return an item that has not yet been delivered.
2. **`ORD-102` (Rahul Verma — Hydrating Sunscreen ₹499):**
   - Status: `Delivered` 14 days ago (Delhivery `DL-441029`).
   - Return Request: **DENIED**. Exceeds the 7-day unopened return window.
   - Damaged Claim: **DENIED**. Damaged items must be reported within 48 hours of delivery.
3. **`ORD-103` (Ananya Patel — Green Tea Face Wash + Toner ₹850):**
   - Status: `Processing` (Ordered 3 hours ago).
   - Cancellation Request: **APPROVED**. Status is `Processing`. Mutation executes: status updates to `Cancelled`. Refund/confirmation issued.
4. **Unknown Order (`ORD-999`):**
   - Status: `Not Found`.
   - Response: Polite recovery asking customer to verify order number.
5. **Out-of-Scope Query ("Book a flight to Goa"):**
   - Response: Polite boundary explaining Aria only handles Aura Skincare inquiries.

---

## 3. Technology Stack & Directory Structure

- **Framework:** Next.js 15 (App Router, React 19, TypeScript).
- **Styling:** Modular Vanilla CSS with CSS Custom Properties (Organic Luxury Theme: Botanical Emerald `#0F382A`, Soft Gold `#D4AF37`, Warm Cream `#FBF9F5`, Glassmorphism `#FFFFFF15`).
- **AI / LLM Orchestration:** Google Gemini 2.5 / 2.0 Flash or Groq LLaMA 3.3 70B (OpenAI SDK compatible format) with native function calling.
- **Speech Synthesis (TTS):** Microsoft Edge Neural TTS (`msedge-tts` / `en-IN-NeerjaNeural`) with client-side Web Audio streaming.
- **Speech Recognition (STT):** Web Speech API (`webkitSpeechRecognition`) with continuous mode, interim results, and Indian English language configuration.
- **Audio Visualization:** HTML5 2D Canvas with Web Audio `AnalyserNode` rendering real-time frequency spectrum waveforms.
- **Hosting / Deployment:** Vercel (Automatic HTTPS, edge CDN, zero-config deployment).

### Repository File Hierarchy:
```
aura-skincare-cx/
├── app/
│   ├── layout.tsx                   # Master Layout with Brand Nav & Luxury Header
│   ├── page.tsx                     # Live Voice CX Agent Studio (Hero Cockpit)
│   ├── orders/
│   │   └── page.tsx                 # Live Order Management System (Interactive OMS)
│   ├── policies/
│   │   └── page.tsx                 # Brand Knowledge & Policy Matrix Hub
│   ├── analytics/
│   │   └── page.tsx                 # Call Logs, CRM JSON Payloads & CSAT Telemetry
│   ├── architecture/
│   │   └── page.tsx                 # Interactive System Architecture & Section 9 Guide
│   └── api/
│       ├── chat/
│       │   └── route.ts             # LLM Orchestrator & Tool Calling Engine
│       ├── tts/
│       │   └── route.ts             # Serverless Neural Edge-TTS Streaming Endpoint
│       ├── orders/
│       │   └── route.ts             # Live In-Memory Order DB & Mutation Handlers
│       └── summary/
│           └── route.ts             # Post-Call Structured JSON Telemetry Generator
├── components/
│   ├── Navbar.tsx                   # Brand Header & Navigation
│   ├── AudioVisualizer.tsx          # 60fps Reactive Waveform Canvas
│   ├── CallCockpit.tsx              # Start/End Call, State Badges & Timer
│   ├── TranscriptStream.tsx         # Live Real-time Conversation Drawer
│   ├── EvaluatorQuickTest.tsx       # 1-Click Scenario Chips & Test Helper
│   ├── PostCallModal.tsx            # Formatted JSON Summary & Clipboard Export
│   ├── OrderCard.tsx                # Interactive Order Card with Live State
│   └── LatencyInspector.tsx         # Real-time Waterfall Performance Metrics
├── lib/
│   ├── brandKnowledge.ts            # Aura Skincare Policies & Knowledge Base
│   ├── orderDatabase.ts             # Seed Orders, Normalizer & State Transitions
│   ├── voiceNormalizer.ts           # Speech Formatter (₹ -> Rupees, Acronyms)
│   └── types.ts                     # TypeScript Type Definitions
├── public/
│   └── favicon.ico
├── README.md                        # Master Documentation with Section 9 Answers
└── package.json
```

---

## 4. Chunked & Block-Based Implementation Roadmap

The project is structured into **6 modular execution chunks**. Each chunk is self-contained, testable, and produces verifiable deliverables.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       MODULAR IMPLEMENTATION ROADMAP                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ CHUNK 1: Foundation, Brand Design Tokens & Navigation Layout                │
│ CHUNK 2: In-Memory Order Database, Regex Normalizer & Policy State Machine   │
│ CHUNK 3: Next.js API Routes (LLM Tool Calling, Policy Engine & Edge-TTS)   │
│ CHUNK 4: Voice Studio Frontend (STT, Web Audio VAD, Barge-in, Waveform)     │
│ CHUNK 5: Multi-Page Operations Suite (/orders, /policies, /analytics)       │
│ CHUNK 6: Post-Call Summary Engine, Section 9 README & Final Verification    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Detailed Chunk Breakdown

#### CHUNK 1: Foundation, Brand Design Tokens & Navigation Layout
- Initialize Next.js 15 project with TypeScript.
- Define luxury botanical CSS design tokens in `app/globals.css`:
  - Color palette: Forest Emerald (`#0A261D`), Pale Sage (`#E8EFE9`), Muted Gold (`#C8A951`), Crisp White (`#FFFFFF`).
  - Typography: Elegant sans-serif hierarchy (Inter / Outfit / Playfair accents).
- Build the global responsive `Navbar.tsx` featuring brand identity, status badge, and routing links (`Voice Studio`, `Live Orders`, `Policies`, `Analytics`, `Architecture`).
- Verify clean compilation and responsive layout.

#### CHUNK 2: In-Memory Order Database, Regex Normalizer & Policy State Machine
- Create `lib/orderDatabase.ts` containing the initial seed data:
  - `ORD-101` (Priya Sharma, Out for Delivery, BlueDart).
  - `ORD-102` (Rahul Verma, Delivered 14 days ago, Delhivery).
  - `ORD-103` (Ananya Patel, Processing, green tea wash + toner).
- Implement regex parser `normalizeOrderId(input: string)`:
  - Handles variations: `"order 101"`, `"ORD one zero one"`, `"101"`, `"o r d 101"`.
- Implement deterministic policy inspection functions:
  - `getOrderDetails(orderId)`: Returns computed fields (`canCancel`, `canReturn`, `policyReason`).
  - `cancelOrder(orderId)`: Validates status; transitions `Processing` $\to$ `Cancelled`; rejects other states.
  - `checkReturnEligibility(orderId, isOpened)`: Validates delivery date; strictly enforces 7-day unopened policy.
- Write unit test validation script to verify all policy edge cases pass deterministically.

#### CHUNK 3: Next.js API Routes (LLM Tool Calling, Policy Engine & Edge-TTS)
- Implement `app/api/orders/route.ts` (GET all orders, POST cancel mutation).
- Implement `app/api/chat/route.ts`:
  - System prompt incorporating Aria persona, Aura brand overview, policy guardrails, and speech output formatting constraints.
  - Tool definitions: `get_order_details`, `cancel_order`.
  - Tool execution middleware invoking deterministic functions from `orderDatabase.ts`.
  - Speech text normalizer stripping markdown, bullets, and formatting currency phonetically.
- Implement `app/api/tts/route.ts`:
  - Connects to Microsoft Neural TTS service using voice `en-IN-NeerjaNeural`.
  - Returns audio stream (`audio/mpeg`) with sub-300ms time-to-first-byte.
- Implement `app/api/summary/route.ts`:
  - Accepts full conversation history; generates required structured JSON telemetry (`customer_intent`, `order_id`, `resolution_status`, `call_summary`, `customer_sentiment`).

#### CHUNK 4: Voice Studio Frontend (STT, Web Audio VAD, Barge-in, Waveform)
- Build `components/CallCockpit.tsx`:
  - Start Call / End Call action buttons.
  - Live visual state badges: `Listening` (Emerald) | `Thinking` (Amber) | `Speaking` (Purple).
  - Active call timer.
- Build `components/AudioVisualizer.tsx`:
  - 60fps HTML5 Canvas frequency waveform reacting to microphone input and agent speech.
- Build Speech & Audio Loop controller:
  - Web Speech API continuous speech capture with `en-IN` configuration.
  - Audio playback manager using Web Audio API `AudioContext`.
  - **Barge-in / Interruption Listener**: Detects customer speech onset during agent playback; triggers instant audio halt and state flip to `Listening`.
- Build `components/EvaluatorQuickTest.tsx`:
  - Interactive scenario helper card directly on screen with 1-click test prompts:
    - *"Track ORD-101 (Out for delivery)"*
    - *"Request Return on ORD-102 (Policy Rejection)"*
    - *"Cancel ORD-103 (Eligible Processing)"*
    - *"Ask for non-existent ORD-999"*
    - *"Out of scope query"*
- Build `components/TranscriptStream.tsx`:
  - Chronological chat bubble stream updating in real time.

#### CHUNK 5: Multi-Page Operations Suite (`/orders`, `/policies`, `/analytics`, `/architecture`)
- Build `/orders` (Live Order Management System):
  - Visual cards for all seed orders showing products, values, tracking links, and real-time status badges.
  - Live synchronization: When an order is cancelled via voice, the status badge here updates in real time.
- Build `/policies` (Brand Knowledge Hub):
  - Interactive policy explorer: Shipping rules, Return/Refund terms, Cancellation requirements, and COD thresholds.
- Build `/analytics` (Call History & CRM Telemetry):
  - Display log of past test sessions.
  - Render formatted JSON summary cards with 1-click copy-to-clipboard.
  - CSAT / Sentiment indicators.
- Build `/architecture` (System Design & Evaluator Hub):
  - Interactive pipeline flow diagram.
  - Real-time latency waterfall breakdown.
  - Complete, detailed answers to Section 9 questions.

#### CHUNK 6: Polish, Section 9 README & Final Verification
- Comprehensive end-to-end testing of every requirement:
  - Audio input & spoken Indian voice output.
  - Tool calling on ORD-101, ORD-102, ORD-103.
  - Rejection of invalid cancellations and expired returns.
  - Graceful recovery on missing and invalid order IDs.
  - Post-call transcript & JSON generation.
  - Barge-in verification.
- Write production-grade `README.md`:
  - System Overview & Architectural Diagrams.
  - Setup instructions & `.env.example`.
  - Complete answers to Section 9:
    1. Why this architecture and technology stack was chosen.
    2. Most difficult engineering challenge and its solution.
    3. What to build next with 1 additional week.
    4. Scaling to 1,000 calls/day in production.
  - Short Approach Note (2–3 sentences) and video demo script.

---

## 5. Risk Assessment & Mitigations

| Potential Risk | Root Cause | Built-In Mitigation |
| :--- | :--- | :--- |
| **Microphone Permission Denied** | Browser security blocks unencrypted HTTP. | Deployed on Vercel with automatic HTTPS. Clear UI error message advising user to allow mic access. |
| **Evaluator Speech Muffled / STT Mismatch** | Accents or mic noise alters order ID format (*"order one zero one"*). | Regex entity extractor normalizes spoken variants to `ORD-101`. Agent verbally confirms order ID before looking up. |
| **TTS Network Latency** | Cloud neural synthesis delay under slow connection. | Sub-300ms stream chunking with automatic instant fallback to local browser neural voice (`Google English India`). |
| **Model Hallucinating Policy Exceptions** | Customer uses emotional persuasion to ask for a refund on opened items. | Policy logic is executed in deterministic TypeScript code, not LLM prompts. Tool response explicitly provides denial reasons that the LLM cannot override. |
| **Cold Starts & Service Downtime** | Serverless hosting containers sleeping. | Zero-cold-start architecture on Vercel. Static UI assets cached at edge; API routes boot in < 50ms. |

---

## 6. Success & Completion Criteria

The project is considered complete and ready for submission when:
1. An evaluator can open the public Vercel URL, click **Start Call**, and converse naturally with Aria.
2. Aria responds in a warm, professional Indian accent (`en-IN`) within < 1 second.
3. The live audio visualizer pulses in response to voice frequencies.
4. Clicking or speaking any of the sample orders triggers the exact correct deterministic policy:
   - `ORD-101` reports delivery status and denies cancellation.
   - `ORD-102` politely denies return due to the 14-day window.
   - `ORD-103` successfully executes cancellation and updates the order status in real time.
5. Interrupting Aria mid-sentence immediately halts audio playback.
6. Ending the call presents the full chronological transcript and formatted JSON outcome.
7. Evaluator can freely navigate between `/`, `/orders`, `/policies`, `/analytics`, and `/architecture`.
8. The README contains full documentation and answers to Section 9.
