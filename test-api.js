#!/usr/bin/env node

const API_BASE = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing Paraphraser API...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await fetch(`${API_BASE}/paraphrase/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health Check:', healthData);
    console.log('');

    // Test 2: Simple Paraphrase
    console.log('2. Testing Simple Paraphrase...');
    const paraphrasePayload = {
      text: 'Hello world, this is a simple test.',
      style: 'SIMPLE',
    };

    const paraphraseResponse = await fetch(`${API_BASE}/paraphrase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paraphrasePayload),
    });

    if (!paraphraseResponse.ok) {
      const errorText = await paraphraseResponse.text();
      console.log('❌ Paraphrase failed:', errorText);
    } else {
      const paraphraseData = await paraphraseResponse.json();
      console.log('✅ Paraphrase Success:', paraphraseData);
    }
    console.log('');

    // Test 3: Bulk Paraphrase
    console.log('3. Testing Bulk Paraphrase...');
    const bulkPayload = [
      { text: 'This is the first sentence.', style: 'SIMPLE' },
      { text: 'This is the second sentence.', style: 'SIMPLE' },
    ];

    const bulkResponse = await fetch(`${API_BASE}/paraphrase/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bulkPayload),
    });

    if (!bulkResponse.ok) {
      const errorText = await bulkResponse.text();
      console.log('❌ Bulk Paraphrase failed:', errorText);
    } else {
      const bulkData = await bulkResponse.json();
      console.log('✅ Bulk Paraphrase Success:', bulkData);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Check if running directly
if (require.main === module) {
  testAPI();
}

module.exports = { testAPI };
