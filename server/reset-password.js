const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const readline = require('readline');

const DB_PATH = path.join(__dirname, 'users.db');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function resetPassword() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 Password Reset Tool');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const email = await question('Enter email address: ');
  const newPassword = await question('Enter new password (min 6 chars): ');

  if (newPassword.length < 6) {
    console.log('❌ Password must be at least 6 characters');
    rl.close();
    return;
  }

  const db = new sqlite3.Database(DB_PATH);

  // Check if user exists
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      console.error('❌ Database error:', err);
      db.close();
      rl.close();
      return;
    }

    if (!user) {
      console.log('❌ User not found:', email);
      db.close();
      rl.close();
      return;
    }

    console.log('✅ User found:', user.email);

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    db.run(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [passwordHash, email],
      function(err) {
        if (err) {
          console.error('❌ Error updating password:', err);
        } else {
          console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('✅ Password reset successful!');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('Email:', email);
          console.log('New Password:', newPassword);
          console.log('\nYou can now login with these credentials!');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        }
        db.close();
        rl.close();
      }
    );
  });
}

resetPassword();

