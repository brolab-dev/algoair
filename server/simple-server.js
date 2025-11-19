// Simple Node.js + Express server to receive air quality data
// Alternative to Firebase

const express = require('express');
const path = require('path');
const cors = require('cors');
const {
  Client,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  PrivateKey,
  AccountId,
} = require('@hashgraph/sdk');
require('dotenv').config();

// Import auth and database
const auth = require('./auth');
const database = require('./database');
const rewards = require('./rewards');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve the website
app.use(express.static(path.join(__dirname, '../website')));

// In-memory storage (use database in production)
let latestData = {
  temperature: 0,
  humidity: 0,
  gas: 0,
  noise: 0,
  pm25: 0,
  pm10: 0,
  aqi: 0,
  status: "NORMAL",
  timestamp: Date.now(),
  deviceId: "ESP32_001"
};

let dataHistory = [];
const MAX_HISTORY = 100;

// Root endpoint
app.get('/api/submissions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const submissions = await database.getAllSubmissions(limit);
    res.json(submissions);
  } catch (error) {
    console.error('Error getting all submissions:', error);
    res.status(500).json({ success: false, error: 'Failed to get submissions' });
  }
});

app.get('/', (req, res) => {
  res.json({
    message: 'Air Quality Monitor API',
    endpoints: {
      'POST /api/auth/register': 'Register new user (email + password)',
      'POST /api/auth/login': 'Login user',
      'GET /api/auth/me': 'Get current user info',
      'GET /api/airquality': 'Get latest sensor data',
      'GET /api/airquality/history': 'Get historical data',
      'POST /api/airquality': 'Post new sensor data (from ESP32)',
      'POST /api/hedera/create-topic': 'Create a new Hedera topic',
      'POST /api/hedera/submit-data': 'Submit data to Hedera topic',
      'POST /api/hedera/submit-shared': 'Submit data to shared topic (recommended)',
      'POST /api/hedera/submit-user': 'Submit data with user auth (auto-signed)',
      'GET /api/hedera/shared-topic': 'Get shared topic information',
      'GET /api/user/submissions': 'Get user submission history',
    }
  });
});

// ============================================
// AUTH ENDPOINTS
// ============================================

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const result = await auth.register(email, password);
    res.json(result);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Registration failed'
    });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const result = await auth.login(email, password);
    res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      error: error.message || 'Login failed'
    });
  }
});

// Get current user info (protected route)
app.get('/api/auth/me', auth.authenticateToken, async (req, res) => {
  try {
    const user = await database.getUserById(req.user.userId);
    const wallet = await database.getWalletByUserId(req.user.userId);
    const submissionCount = await database.getSubmissionCount(req.user.userId);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        hederaAccountId: wallet ? wallet.hedera_account_id : null,
        submissionCount,
        createdAt: user.created_at,
        lastLogin: user.last_login,
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user info'
    });
  }
});

// Get latest air quality data
app.get('/api/airquality', (req, res) => {
  res.json({
    success: true,
    data: latestData
  });
});

// Get historical data
app.get('/api/airquality/history', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  res.json({
    success: true,
    data: dataHistory.slice(-limit)
  });
});

// Receive data from ESP32
app.post('/api/airquality', (req, res) => {
  const { temperature, humidity, gas, noise, pm25, pm10, aqi, status, deviceId } = req.body;

  // Validate data
  if (temperature === undefined || humidity === undefined) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields'
    });
  }

  // Update latest data
  latestData = {
    temperature,
    humidity,
    gas,
    noise,
    pm25: pm25 !== undefined ? pm25 : 0,
    pm10: pm10 !== undefined ? pm10 : 0,
    aqi: aqi !== undefined ? aqi : 0,
    status,
    timestamp: Date.now(),
    deviceId: deviceId || "ESP32_001"
  };
  
  // Add to history
  dataHistory.push({ ...latestData });
  
  // Keep only last MAX_HISTORY entries
  if (dataHistory.length > MAX_HISTORY) {
    dataHistory.shift();
  }
  
  console.log('Received data:', latestData);
  
  res.json({
    success: true,
    message: 'Data received successfully',
    data: latestData
  });
});

// ============================================
// HEDERA BLOCKCHAIN ENDPOINTS
// ============================================

// Create a new Hedera topic
app.post('/api/hedera/create-topic', async (req, res) => {
  try {
    const { accountId, privateKey } = req.body;

    if (!accountId || !privateKey) {
      return res.status(400).json({
        success: false,
        error: 'Account ID and Private Key are required'
      });
    }

    // Create Hedera client
    const client = Client.forTestnet();
    client.setOperator(
      AccountId.fromString(accountId),
      PrivateKey.fromString(privateKey)
    );

    // Create a new topic
    const transaction = new TopicCreateTransaction();
    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const topicId = receipt.topicId.toString();

    console.log(`✅ Created new Hedera topic: ${topicId}`);

    client.close();

    res.json({
      success: true,
      topicId: topicId,
      message: 'Topic created successfully'
    });
  } catch (error) {
    console.error('Error creating topic:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create topic'
    });
  }
});

// Submit data to Hedera topic
app.post('/api/hedera/submit-data', async (req, res) => {
  try {
    const { accountId, privateKey, topicId, data } = req.body;

    if (!accountId || !privateKey || !topicId) {
      return res.status(400).json({
        success: false,
        error: 'Account ID, Private Key, and Topic ID are required'
      });
    }

    // Create Hedera client
    const client = Client.forTestnet();
    client.setOperator(
      AccountId.fromString(accountId),
      PrivateKey.fromString(privateKey)
    );

    // Prepare data to submit
    const dataToSubmit = data || latestData;
    const message = JSON.stringify({
      ...dataToSubmit,
      submittedAt: new Date().toISOString()
    });

    // Submit message to topic
    const transaction = new TopicMessageSubmitTransaction({
      topicId: topicId,
      message: message,
    });

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    console.log(`✅ Submitted data to Hedera topic ${topicId}`);
    console.log(`   Data: ${message.substring(0, 100)}...`);

    client.close();

    res.json({
      success: true,
      message: 'Data submitted to Hedera successfully',
      topicId: topicId,
      timestamp: new Date().toISOString(),
      data: dataToSubmit
    });
  } catch (error) {
    console.error('Error submitting to Hedera:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit data to Hedera'
    });
  }
});

// Get shared topic information
app.get('/api/hedera/shared-topic', (req, res) => {
  const sharedTopicId = process.env.SHARED_TOPIC_ID;

  if (!sharedTopicId) {
    return res.status(404).json({
      success: false,
      error: 'Shared topic not configured. Run: node setup-interactive.js'
    });
  }

  res.json({
    success: true,
    topicId: sharedTopicId,
    hashscanUrl: `https://hashscan.io/testnet/topic/${sharedTopicId}`,
    message: 'Shared topic for all users'
  });
});

// Submit data to shared topic (recommended for all users)
app.post('/api/hedera/submit-shared', async (req, res) => {
  try {
    const { data, userId, location } = req.body;

    // Get shared topic credentials from environment
    const accountId = process.env.HEDERA_ACCOUNT_ID;
    const privateKey = process.env.HEDERA_PRIVATE_KEY;
    const sharedTopicId = process.env.SHARED_TOPIC_ID;

    if (!accountId || !privateKey || !sharedTopicId) {
      return res.status(500).json({
        success: false,
        error: 'Shared topic not configured. Please run setup-interactive.js on the server.'
      });
    }

    // Create Hedera client
    const client = Client.forTestnet();
    client.setOperator(
      AccountId.fromString(accountId),
      PrivateKey.fromString(privateKey)
    );

    // Prepare data to submit with metadata
    const dataToSubmit = data || latestData;
    const message = JSON.stringify({
      ...dataToSubmit,
      userId: userId || 'anonymous',
      location: location || 'unknown',
      submittedAt: new Date().toISOString(),
      source: 'mobile-app'
    });

    // Submit message to shared topic
    const transaction = new TopicMessageSubmitTransaction({
      topicId: sharedTopicId,
      message: message,
    });

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    console.log(`✅ Submitted data to shared topic ${sharedTopicId}`);
    console.log(`   User: ${userId || 'anonymous'}, Location: ${location || 'unknown'}`);
    console.log(`   Data: ${message.substring(0, 100)}...`);

    client.close();

    res.json({
      success: true,
      message: 'Data submitted to shared topic successfully',
      topicId: sharedTopicId,
      timestamp: new Date().toISOString(),
      hashscanUrl: `https://hashscan.io/testnet/topic/${sharedTopicId}`,
      data: dataToSubmit
    });
  } catch (error) {
    console.error('Error submitting to shared topic:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit data to shared topic'
    });
  }
});

// Submit data with user authentication (auto-signed by backend)
app.post('/api/hedera/submit-user', auth.authenticateToken, async (req, res) => {
  try {
    const { data } = req.body;

    // Get shared topic credentials from environment
    const accountId = process.env.HEDERA_ACCOUNT_ID;
    const privateKey = process.env.HEDERA_PRIVATE_KEY;
    const sharedTopicId = process.env.SHARED_TOPIC_ID;

    if (!accountId || !privateKey || !sharedTopicId) {
      return res.status(500).json({
        success: false,
        error: 'Shared topic not configured. Please run setup-interactive.js on the server.'
      });
    }

    // Get user's wallet info
    const wallet = await database.getWalletByUserId(req.user.userId);
    const user = await database.getUserById(req.user.userId);

    // Create Hedera client
    const client = Client.forTestnet();
    client.setOperator(
      AccountId.fromString(accountId),
      PrivateKey.fromString(privateKey)
    );

    // Prepare data to submit with user info
    const dataToSubmit = data || latestData;
    const message = JSON.stringify({
      ...dataToSubmit,
      userId: user.email,
      hederaAccountId: wallet ? wallet.hedera_account_id : 'pending',
      submittedAt: new Date().toISOString(),
      source: 'mobile-app-authenticated'
    });

    // Submit message to shared topic
    const transaction = new TopicMessageSubmitTransaction({
      topicId: sharedTopicId,
      message: message,
    });

    const txResponse = await transaction.execute(client);
    await txResponse.getReceipt(client);

    console.log(`✅ Submitted data to shared topic ${sharedTopicId}`);
    console.log(`   User: ${user.email}, Hedera Account: ${wallet?.hedera_account_id || 'pending'}`);
    console.log(`   Data: ${message.substring(0, 100)}...`);

    // Record submission in database
    await database.recordSubmission(req.user.userId, sharedTopicId, dataToSubmit);

    client.close();

    res.json({
      success: true,
      message: 'Data submitted to Hedera successfully',
      topicId: sharedTopicId,
      timestamp: new Date().toISOString(),
      hashscanUrl: `https://hashscan.io/testnet/topic/${sharedTopicId}`,
      data: dataToSubmit,
      userEmail: user.email,
      hederaAccountId: wallet?.hedera_account_id,
    });
  } catch (error) {
    console.error('Error submitting to Hedera:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit data to Hedera'
    });
  }
});

// Get user submission history
app.get('/api/user/submissions', auth.authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const submissions = await database.getUserSubmissions(req.user.userId, limit);
    const count = await database.getSubmissionCount(req.user.userId);

    res.json({
      success: true,
      submissions: submissions.map(s => ({
        id: s.id,
        topicId: s.topic_id,
        data: JSON.parse(s.data),
        submittedAt: s.submitted_at,
      })),
      totalCount: count,
    });
  } catch (error) {
    console.error('Error getting submissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get submissions'
    });
  }
});

// Get unclaimed submissions
app.get('/api/rewards/unclaimed', auth.authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const unclaimed = await database.getUnclaimedSubmissions(userId);

    res.json({
      success: true,
      unclaimed: unclaimed.map(s => ({
        id: s.id,
        topicId: s.topic_id,
        data: JSON.parse(s.data),
        submittedAt: s.submitted_at,
        rewardAmount: rewards.REWARD_AMOUNT,
      })),
    });
  } catch (error) {
    console.error('Error getting unclaimed submissions:', error);
    res.status(500).json({ success: false, error: 'Failed to get unclaimed submissions' });
  }
});

// Get user's token balance
app.get('/api/rewards/balance', auth.authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const balance = await database.getTokenBalance(userId);

    res.json({
      success: true,
      balance: balance || 0,
    });
  } catch (error) {
    console.error('Error getting token balance:', error);
    res.status(500).json({ success: false, error: 'Failed to get token balance' });
  }
});

// Claim all available rewards
app.post('/api/rewards/claim-all', auth.authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const unclaimed = await database.getUnclaimedSubmissions(userId);

    if (unclaimed.length === 0) {
      return res.status(400).json({ success: false, error: 'No rewards to claim' });
    }

    const totalReward = unclaimed.length * rewards.REWARD_AMOUNT;
    const userWallet = await database.getWalletByUserId(userId);

    if (!userWallet) {
      return res.status(404).json({ success: false, error: 'User wallet not found' });
    }

    const transferStatus = await rewards.transferAARTokens(userWallet.hedera_account_id, totalReward);

    if (transferStatus === 'SUCCESS') {
      for (const submission of unclaimed) {
        await database.markSubmissionClaimed(submission.id);
        await database.logReward(userId, submission.id, rewards.REWARD_AMOUNT);
      }
      await database.updateTokenBalance(userId, totalReward);

      res.json({ success: true, message: `Successfully claimed ${totalReward} AIR tokens` });
    } else {
      res.status(500).json({ success: false, error: 'Failed to transfer tokens' });
    }
  } catch (error) {
    console.error('Error claiming all rewards:', error);
    res.status(500).json({ success: false, error: 'Failed to claim all rewards' });
  }
});

// Claim reward for a submission
app.post('/api/rewards/claim', auth.authenticateToken, async (req, res) => {
  try {
    const { submissionId } = req.body;
    const userId = req.user.userId;

    const submission = await database.getSubmissionById(submissionId);

    if (!submission || submission.user_id !== userId) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }

    if (submission.reward_claimed) {
      return res.status(400).json({ success: false, error: 'Reward already claimed' });
    }

    const userWallet = await database.getWalletByUserId(userId);
    if (!userWallet) {
      return res.status(404).json({ success: false, error: 'User wallet not found' });
    }

    const transferStatus = await rewards.transferAARTokens(userWallet.hedera_account_id);

    if (transferStatus === 'SUCCESS') {
      await database.markSubmissionClaimed(submissionId);
      await database.updateTokenBalance(userId, rewards.REWARD_AMOUNT);
      await database.logReward(userId, submissionId, rewards.REWARD_AMOUNT);

      res.json({ success: true, message: 'Reward claimed successfully' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to transfer tokens' });
    }
  } catch (error) {
    console.error('Error claiming reward:', error);
    res.status(500).json({ success: false, error: 'Failed to claim reward' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Air Quality Monitor Server running on port ${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api/airquality`);
  console.log(`📊 View latest data: http://localhost:${PORT}/api/airquality`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

