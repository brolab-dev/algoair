const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Client, PrivateKey, AccountCreateTransaction, Hbar } = require('@hashgraph/sdk');
const database = require('./database');
const rewards = require('./rewards');

// JWT secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

// Hedera client setup
const HEDERA_OPERATOR_ID = process.env.HEDERA_ACCOUNT_ID;
const HEDERA_OPERATOR_KEY = process.env.HEDERA_PRIVATE_KEY;

// Generate JWT token
function generateToken(userId, email) {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Middleware to authenticate requests
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ success: false, error: 'Invalid or expired token' });
  }

  req.user = decoded;
  next();
}

// Create Hedera account for new user
async function createHederaAccount() {
  try {
    // Create Hedera client
    const client = Client.forTestnet();
    client.setOperator(HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY);

    // Generate new key pair for the user
    const newAccountPrivateKey = PrivateKey.generateED25519();
    const newAccountPublicKey = newAccountPrivateKey.publicKey;

    // Create new account
    const newAccount = await new AccountCreateTransaction()
      .setKey(newAccountPublicKey)
      .setInitialBalance(Hbar.fromTinybars(1000)) // Give user some initial balance
      .execute(client);

    // Get the new account ID
    const getReceipt = await newAccount.getReceipt(client);
    const newAccountId = getReceipt.accountId;

    client.close();

    return {
      accountId: newAccountId.toString(),
      privateKey: newAccountPrivateKey.toString(),
    };
  } catch (error) {
    console.error('Error creating Hedera account:', error);
    throw error;
  }
}

// Register new user
async function register(email, password) {
  try {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Validate password
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Check if user already exists
    const existingUser = await database.getUserByEmail(email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user in database
    const user = await database.createUser(email, passwordHash);

    // Create Hedera wallet for user
    console.log(`🔨 Creating Hedera wallet for user: ${email}`);
    const wallet = await createHederaAccount();
    console.log(`✅ Hedera wallet created: ${wallet.accountId}`);

    // Store wallet in database
    await database.createWallet(user.id, wallet.accountId, wallet.privateKey);

    // Associate AIR token with the new account
    console.log(`[object Object]Associating AIR token with account: ${wallet.accountId}`);
    const userPrivateKey = PrivateKey.fromString(wallet.privateKey);
    const associationStatus = await rewards.associateToken(wallet.accountId, userPrivateKey);
    console.log(`[object Object]Token association status: ${associationStatus}`);

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        hederaAccountId: wallet.accountId,
      },
    };
  } catch (error) {
    throw error;
  }
}

// Login user
async function login(email, password) {
  try {
    // Get user from database
    const user = await database.getUserByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await database.updateLastLogin(user.id);

    // Get user's wallet
    const wallet = await database.getWalletByUserId(user.id);

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        hederaAccountId: wallet ? wallet.hedera_account_id : null,
      },
    };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  register,
  login,
  authenticateToken,
  verifyToken,
  generateToken,
};

