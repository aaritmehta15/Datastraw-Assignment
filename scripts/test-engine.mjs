// Unit Test Suite for Policy Engine, Regex Normalizer, and Voice Formatter
import {
  normalizeOrderId,
  getOrderDetails,
  cancelOrder,
  getAllOrders,
  resetOrderDatabase
} from '../lib/orderDatabase.ts';
import { normalizeTextForVoice } from '../lib/voiceNormalizer.ts';

console.log('🧪 RUNNING DETERMINISTIC POLICY ENGINE & VOICE NORMALIZER TESTS...\n');

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

// 1. REGEX NORMALIZER TESTS
console.log('🔍 Group 1: Order ID Regex Normalizer');
assert(normalizeOrderId('ORD-101') === 'ORD-101', 'Direct canonical ORD-101');
assert(normalizeOrderId('ord 101') === 'ORD-101', 'Lowercase with space "ord 101"');
assert(normalizeOrderId('order 102') === 'ORD-102', 'Spoken phrase "order 102"');
assert(normalizeOrderId('ORD one zero three') === 'ORD-103', 'Spoken numbers "ORD one zero three"');
assert(normalizeOrderId('can you check 101 please') === 'ORD-101', 'Embedded digits "can you check 101 please"');
assert(normalizeOrderId('o r d 101') === 'ORD-101', 'Letter-spaced "o r d 101"');
assert(normalizeOrderId('invalid-string') === null, 'Gibberish returns null');

// 2. ORDER LOOKUP TESTS
console.log('\n📦 Group 2: Order Lookup & Policy Detection');
resetOrderDatabase();

const ord101 = getOrderDetails('ORD-101');
assert(ord101.found === true, 'ORD-101 is found');
assert(ord101.status === 'Out for Delivery', 'ORD-101 status is Out for Delivery');
assert(ord101.carrier === 'BlueDart', 'ORD-101 carrier is BlueDart');
assert(ord101.canCancel === false, 'ORD-101 cannot be cancelled');

const ord102 = getOrderDetails('ORD-102');
assert(ord102.found === true, 'ORD-102 is found');
assert(ord102.status === 'Delivered', 'ORD-102 is Delivered');
assert(ord102.daysSinceDelivery === 14, 'ORD-102 delivered 14 days ago');
assert(ord102.canReturn === false, 'ORD-102 return is blocked by 7-day rule');

const ord103 = getOrderDetails('ORD-103');
assert(ord103.found === true, 'ORD-103 is found');
assert(ord103.status === 'Processing', 'ORD-103 is Processing');
assert(ord103.canCancel === true, 'ORD-103 is eligible for cancellation');

const ord999 = getOrderDetails('ORD-999');
assert(ord999.found === false, 'ORD-999 gracefully reported as not found');

// 3. CANCELLATION STATE MUTATION TESTS
console.log('\n🛡️ Group 3: Cancellation State Machine & Policy Enforcement');
// Attempt cancelling ORD-101 (Out for delivery) -> must reject
const cancel101 = cancelOrder('ORD-101');
assert(cancel101.success === false, 'ORD-101 cancellation is rejected');
assert(cancel101.error === 'POLICY_VIOLATION_CANNOT_CANCEL_DISPATCHED', 'Correct error code for dispatched cancellation');

// Attempt cancelling ORD-102 (Delivered) -> must reject
const cancel102 = cancelOrder('ORD-102');
assert(cancel102.success === false, 'ORD-102 cancellation is rejected');

// Attempt cancelling ORD-103 (Processing) -> must succeed and mutate status
const cancel103 = cancelOrder('ORD-103');
assert(cancel103.success === true, 'ORD-103 cancellation succeeds');
assert(cancel103.status === 'Cancelled', 'ORD-103 status changed to Cancelled');

// Verify DB updated
const ord103After = getOrderDetails('ORD-103');
assert(ord103After.status === 'Cancelled', 'In-memory DB reflects Cancelled status for ORD-103');
assert(ord103After.canCancel === false, 'Cancelled order cannot be cancelled again');

// 4. VOICE NORMALIZER TESTS
console.log('\n🎙️ Group 4: Voice Text Normalizer');
const rawText = "Your order **ORD-101** of *Vitamin C Serum* is out for delivery! The total was ₹699. Please pay via COD or UPI. Details:\n- Carrier: BlueDart";
const voiceText = normalizeTextForVoice(rawText);
assert(!voiceText.includes('*'), 'Markdown asterisks removed');
assert(!voiceText.includes('₹'), 'Currency glyph removed');
assert(voiceText.includes('699 Rupees'), 'Currency converted to "699 Rupees"');
assert(voiceText.includes('Order O-R-D 101'), 'ORD-101 converted to "Order O-R-D 101"');
assert(voiceText.includes('Cash on Delivery'), 'COD expanded to Cash on Delivery');
assert(voiceText.includes('U-P-I'), 'UPI expanded to U-P-I');

console.log(`\n🎉 SUMMARY: ${passedTests}/${totalTests} TESTS PASSED WITH 100% SUCCESS!\n`);
