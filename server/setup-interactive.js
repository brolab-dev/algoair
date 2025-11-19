/**
 * Interactive Setup for Shared Hedera Topic
 */

const readline = require('readline');
const fs = require('fs');
const { Client, TopicCreateTransaction, PrivateKey, AccountId } = require('@hashgraph/sdk');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setup() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌿 Air Quality Monitor - Shared Hedera Topic Setup');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Check for existing .env
  let accountId, privateKey;
  
  if (fs.existsSync('.env')) {
    console.log('✅ Found existing .env file\n');
    require('dotenv').config();
    accountId = process.env.HEDERA_ACCOUNT_ID;
    privateKey = process.env.HEDERA_PRIVATE_KEY;
  }

  if (!accountId || !privateKey) {
    console.log('📝 Please enter your Hedera Testnet credentials:');
    console.log('   (Get free testnet account at: https://portal.hedera.com)\n');
    
    accountId = await question('Hedera Account ID (e.g., 0.0.12345): ');
    privateKey = await question('Hedera Private Key: ');
    console.log('');
  }

  try {
    // Create Hedera client
    console.log('📡 Connecting to Hedera Testnet...');
    const client = Client.forTestnet();
    client.setOperator(
      AccountId.fromString(accountId.trim()),
      PrivateKey.fromString(privateKey.trim())
    );
    console.log(`✅ Connected with account: ${accountId}\n`);

    // Create the topic
    console.log('🔨 Creating shared topic...');
    const transaction = new TopicCreateTransaction()
      .setTopicMemo('Air Quality Monitoring - Shared Topic for All Users')
      .setAdminKey(PrivateKey.fromString(privateKey.trim()).publicKey)
      .setSubmitKey(PrivateKey.fromString(privateKey.trim()).publicKey);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const topicId = receipt.topicId.toString();

    console.log('✅ Topic created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 SHARED TOPIC INFORMATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Topic ID: ${topicId}`);
    console.log(`Account ID: ${accountId}`);
    console.log(`Memo: Air Quality Monitoring - Shared Topic`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Save to .env
    const envContent = `# Server Configuration
PORT=3000

# Hedera Testnet Credentials
HEDERA_ACCOUNT_ID=${accountId.trim()}
HEDERA_PRIVATE_KEY=${privateKey.trim()}

# Shared Topic ID (created: ${new Date().toISOString()})
SHARED_TOPIC_ID=${topicId}
`;

    fs.writeFileSync('.env', envContent);
    console.log('💾 Saved to .env file\n');

    // Save config
    const config = {
      topicId: topicId,
      accountId: accountId.trim(),
      createdAt: new Date().toISOString(),
      memo: 'Air Quality Monitoring - Shared Topic for All Users',
      hashscanUrl: `https://hashscan.io/testnet/topic/${topicId}`
    };

    fs.writeFileSync('shared-topic-config.json', JSON.stringify(config, null, 2));
    console.log('💾 Configuration saved to: shared-topic-config.json\n');

    console.log('📝 NEXT STEPS:\n');
    console.log('1. ✅ Topic created and saved to .env');
    console.log('2. 🔄 Restart the server: npm start');
    console.log('3. 📱 Update mobile app (instructions below)');
    console.log('4. 🌐 View submissions at:');
    console.log(`   https://hashscan.io/testnet/topic/${topicId}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    client.close();
    rl.close();

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nPlease check your credentials and try again.\n');
    rl.close();
    process.exit(1);
  }
}

setup();

