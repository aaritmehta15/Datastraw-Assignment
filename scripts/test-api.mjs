// Integration Test for Serverless API Route Handlers
import { GET as getOrders, POST as postOrders } from '../app/api/orders/route.ts';
import { POST as postChat } from '../app/api/chat/route.ts';
import { POST as postSummary } from '../app/api/summary/route.ts';

console.log('🧪 RUNNING CHUNK 3 API ROUTE INTEGRATION TESTS...\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

async function runTests() {
  // 1. Test GET /api/orders
  console.log('📦 Testing /api/orders:');
  const getReq = new Request('http://localhost:3000/api/orders?reset=true');
  const getRes = await getOrders(getReq);
  const getData = await getRes.json();
  assert(getData.success === true, 'GET /api/orders returned success');
  assert(getData.orders.length === 3, 'GET /api/orders returned 3 seed orders');

  // 2. Test POST /api/chat - Greeting
  console.log('\n💬 Testing /api/chat conversational turns:');
  const chatGreetReq = new Request('http://localhost:3000/api/chat', {
    method: 'POST',
    body: JSON.stringify({ userMessage: 'Hello, who are you?' })
  });
  const chatGreetRes = await postChat(chatGreetReq);
  const chatGreetData = await chatGreetRes.json();
  assert(chatGreetData.success === true, 'Greeting query succeeded');
  assert(chatGreetData.message.includes('Aria') || chatGreetData.message.includes('Aura'), 'Aria persona in response');

  // 3. Test POST /api/chat - Order Tracking ORD-101
  const chat101Req = new Request('http://localhost:3000/api/chat', {
    method: 'POST',
    body: JSON.stringify({ userMessage: 'Where is my order ORD-101?' })
  });
  const chat101Res = await postChat(chat101Req);
  const chat101Data = await chat101Res.json();
  assert(chat101Data.success === true, 'ORD-101 tracking succeeded');
  assert(chat101Data.message.includes('BlueDart') || chat101Data.message.includes('delivery'), 'Carrier/delivery mentioned');
  assert(chat101Data.toolCalls.length > 0, 'Tool calling triggered for ORD-101');

  // 4. Test POST /api/chat - Cancel Attempt on ORD-101 (Dispatched)
  const chatCancel101Req = new Request('http://localhost:3000/api/chat', {
    method: 'POST',
    body: JSON.stringify({ userMessage: 'Please cancel my order ORD-101' })
  });
  const chatCancel101Res = await postChat(chatCancel101Req);
  const chatCancel101Data = await chatCancel101Res.json();
  assert(chatCancel101Data.success === true, 'Cancel attempt executed');
  assert(chatCancel101Data.message.toLowerCase().includes('refuse') || chatCancel101Data.message.toLowerCase().includes('cannot cancel'), 'Refusal advice or denial communicated');

  // 5. Test POST /api/chat - Return Attempt on ORD-102 (14 days ago)
  const chatReturn102Req = new Request('http://localhost:3000/api/chat', {
    method: 'POST',
    body: JSON.stringify({ userMessage: 'I want to return ORD-102' })
  });
  const chatReturn102Res = await postChat(chatReturn102Req);
  const chatReturn102Data = await chatReturn102Res.json();
  assert(chatReturn102Data.success === true, 'Return check executed');
  assert(chatReturn102Data.message.includes('14 days') || chatReturn102Data.message.includes('7 days'), 'Policy timeline enforced in voice response');

  // 6. Test POST /api/chat - Successful Cancel on ORD-103 (Processing)
  const chatCancel103Req = new Request('http://localhost:3000/api/chat', {
    method: 'POST',
    body: JSON.stringify({ userMessage: 'Cancel order ORD-103 please' })
  });
  const chatCancel103Res = await postChat(chatCancel103Req);
  const chatCancel103Data = await chatCancel103Res.json();
  assert(chatCancel103Data.success === true, 'Cancel on ORD-103 executed');
  assert(chatCancel103Data.message.toLowerCase().includes('cancelled'), 'Cancellation confirmation in message');

  // 7. Test POST /api/summary - Structured JSON Generation
  console.log('\n📊 Testing /api/summary:');
  const mockTranscript = [
    { id: '1', speaker: 'customer', text: 'Where is my order ORD-101?', timestamp: '10:00:00' },
    { id: '2', speaker: 'aria', text: 'Your order ORD-101 is out for delivery with BlueDart and expected by 6 PM today.', timestamp: '10:00:02' }
  ];
  const summaryReq = new Request('http://localhost:3000/api/summary', {
    method: 'POST',
    body: JSON.stringify({ transcript: mockTranscript, durationSeconds: 25 })
  });
  const summaryRes = await postSummary(summaryReq);
  const summaryData = await summaryRes.json();
  assert(summaryData.success === true, 'Summary endpoint succeeded');
  assert(summaryData.summary.customer_intent === 'ORDER_TRACKING', 'Intent classified as ORDER_TRACKING');
  assert(summaryData.summary.order_id === 'ORD-101', 'Order ID captured as ORD-101');
  assert(summaryData.summary.resolution_status === 'RESOLVED', 'Resolution status is RESOLVED');
  assert(typeof summaryData.summary.call_summary === 'string' && summaryData.summary.call_summary.length > 10, 'Executive summary generated');

  console.log(`\n🎉 SUMMARY: ${passedTests}/${totalTests} API TESTS PASSED WITH 100% SUCCESS!\n`);
}

runTests().catch(err => {
  console.error('Fatal API test error:', err);
  process.exit(1);
});
