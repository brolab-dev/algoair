// Test script for Hedera endpoints
// Usage: node test-hedera.js

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const SERVER_URL = 'http://localhost:3000';

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function testCreateTopic() {
  console.log('\n=== Test: Create Hedera Topic ===\n');
  
  const accountId = await question('Enter your Hedera Account ID (e.g., 0.0.xxxxx): ');
  const privateKey = await question('Enter your Hedera Private Key: ');

  console.log('\nCreating topic...');

  try {
    const response = await fetch(`${SERVER_URL}/api/hedera/create-topic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId: accountId.trim(),
        privateKey: privateKey.trim(),
      }),
    });

    const result = await response.json();

    if (result.success) {
      console.log('\n✅ SUCCESS!');
      console.log(`Topic ID: ${result.topicId}`);
      console.log('\nSave this Topic ID for submitting data!');
      return result.topicId;
    } else {
      console.log('\n❌ ERROR:', result.error);
      return null;
    }
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
    return null;
  }
}

async function testSubmitData() {
  console.log('\n=== Test: Submit Data to Hedera ===\n');
  
  const accountId = await question('Enter your Hedera Account ID: ');
  const privateKey = await question('Enter your Hedera Private Key: ');
  const topicId = await question('Enter your Topic ID: ');

  console.log('\nSubmitting test data...');

  const testData = {
    temperature: 25.5,
    humidity: 60,
    gas: 150,
    noise: 45,
    pm25: 12,
    pm10: 18,
    aqi: 45,
    status: 'NORMAL',
  };

  try {
    const response = await fetch(`${SERVER_URL}/api/hedera/submit-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId: accountId.trim(),
        privateKey: privateKey.trim(),
        topicId: topicId.trim(),
        data: testData,
      }),
    });

    const result = await response.json();

    if (result.success) {
      console.log('\n✅ SUCCESS!');
      console.log(`Data submitted to topic: ${result.topicId}`);
      console.log(`Timestamp: ${result.timestamp}`);
      console.log('\nView your data at:');
      console.log(`https://hashscan.io/testnet/topic/${result.topicId}`);
    } else {
      console.log('\n❌ ERROR:', result.error);
    }
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
  }
}

async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Hedera Integration Test Script      ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('\nMake sure the server is running on http://localhost:3000\n');

  const choice = await question('What would you like to test?\n1. Create Topic\n2. Submit Data\n\nChoice (1 or 2): ');

  if (choice.trim() === '1') {
    await testCreateTopic();
  } else if (choice.trim() === '2') {
    await testSubmitData();
  } else {
    console.log('Invalid choice');
  }

  rl.close();
}

main().catch(console.error);

