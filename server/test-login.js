const bcrypt = require('bcryptjs');
const database = require('./database');

async function testLogin() {
  const email = 'cuongquep0102@gmail.com';
  const password = process.argv[2] || 'test123'; // Get password from command line

  console.log('Testing login for:', email);
  console.log('Password:', password);

  try {
    // Get user from database
    const user = await database.getUserByEmail(email);
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:', user.email);
    console.log('Password hash:', user.password_hash);

    // Test password
    const isValid = await bcrypt.compare(password, user.password_hash);
    console.log('Password valid:', isValid);

    if (isValid) {
      console.log('✅ Login would succeed!');
      
      // Get wallet
      const wallet = await database.getWalletByUserId(user.id);
      console.log('Wallet:', wallet?.hedera_account_id);
    } else {
      console.log('❌ Password incorrect');
      console.log('\nTry running: node test-login.js YOUR_PASSWORD');
    }
  } catch (error) {
    console.error('Error:', error);
  }

  process.exit(0);
}

testLogin();

