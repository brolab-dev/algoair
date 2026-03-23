const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

// Database file path
const DB_PATH = path.join(__dirname, 'users.db');

// Encryption key for private keys (in production, use environment variable)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key!!';
const ALGORITHM = 'aes-256-cbc';

// Initialize database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('✅ Connected to SQLite database');
    initializeTables();
  }
});

// Create tables
function initializeTables() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      )
    `, (err) => {
      if (err) {
        console.error('Error creating users table:', err);
      } else {
        console.log('✅ Users table ready');
      }
    });

    // Wallets table
    db.run(`
      CREATE TABLE IF NOT EXISTS wallets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        hedera_account_id TEXT NOT NULL,
        hedera_private_key_encrypted TEXT NOT NULL,
        air_token_balance REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating wallets table:', err);
      } else {
        console.log('✅ Wallets table ready');
        // Add air_token_balance column if it doesn't exist (for existing databases)
        db.run(`ALTER TABLE wallets ADD COLUMN air_token_balance REAL DEFAULT 0`, (alterErr) => {
          // Ignore error if column already exists
          if (alterErr && !alterErr.message.includes('duplicate column')) {
            console.error('Error adding air_token_balance column:', alterErr);
          }
        });
      }
    });

    // Submissions table (track user submissions)
    db.run(`
      CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        topic_id TEXT NOT NULL,
        data TEXT NOT NULL,
        reward_claimed BOOLEAN DEFAULT FALSE,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating submissions table:', err);
      } else {
        console.log('✅ Submissions table ready');
        // Add reward_claimed column if it doesn't exist
        db.run(`ALTER TABLE submissions ADD COLUMN reward_claimed BOOLEAN DEFAULT FALSE`, (alterErr) => {
          if (alterErr && !alterErr.message.includes('duplicate column')) {
            console.error('Error adding reward_claimed column:', alterErr);
          }
        });
        // Add latitude/longitude columns if they don't exist
        db.run(`ALTER TABLE submissions ADD COLUMN latitude REAL`, (alterErr) => {
          if (alterErr && !alterErr.message.includes('duplicate column')) {
            console.error('Error adding latitude column:', alterErr);
          }
        });
        db.run(`ALTER TABLE submissions ADD COLUMN longitude REAL`, (alterErr) => {
          if (alterErr && !alterErr.message.includes('duplicate column')) {
            console.error('Error adding longitude column:', alterErr);
          }
        });
      }
    });

    // Rewards table (track user rewards)
    db.run(`
      CREATE TABLE IF NOT EXISTS rewards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        submission_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        rewarded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (submission_id) REFERENCES submissions(id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating rewards table:', err);
      } else {
        console.log('✅ Rewards table ready');
      }
    });
  });
}

// Encryption helpers
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// Database operations
const database = {
  // Create user
  createUser: (email, passwordHash) => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (email, password_hash) VALUES (?, ?)',
        [email, passwordHash],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, email });
        }
      );
    });
  },

  // Get user by email
  getUserByEmail: (email) => {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE email = ?',
        [email],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  },

  // Get user by ID
  getUserById: (id) => {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  },

  // Update last login
  updateLastLogin: (userId) => {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [userId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  },

  // Create wallet for user
  createWallet: (userId, accountId, privateKey) => {
    return new Promise((resolve, reject) => {
      const encryptedKey = encrypt(privateKey);
      db.run(
        'INSERT INTO wallets (user_id, hedera_account_id, hedera_private_key_encrypted) VALUES (?, ?, ?)',
        [userId, accountId, encryptedKey],
        function(err) {
          if (err) reject(err);
          else resolve({ userId, accountId });
        }
      );
    });
  },

  // Get wallet by user ID
  getWalletByUserId: (userId) => {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM wallets WHERE user_id = ?',
        [userId],
        (err, row) => {
          if (err) {
            reject(err);
          } else if (row) {
            // Decrypt private key
            row.hedera_private_key = decrypt(row.hedera_private_key_encrypted);
            delete row.hedera_private_key_encrypted;
            resolve(row);
          } else {
            resolve(null);
          }
        }
      );
    });
  },

  // Record submission
  recordSubmission: (userId, topicId, data, latitude, longitude) => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO submissions (user_id, topic_id, data, latitude, longitude) VALUES (?, ?, ?, ?, ?)',
        [userId, topicId, JSON.stringify(data), latitude, longitude],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  },

  // Get user submissions
  getUserSubmissions: (userId, limit = 10) => {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM submissions WHERE user_id = ? ORDER BY submitted_at DESC LIMIT ?',
        [userId, limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  },

  // Get submission count
  getSubmissionCount: (userId) => {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT COUNT(*) as count FROM submissions WHERE user_id = ?',
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
        }
      );
    });
  },

  // Update token balance for a user
  updateTokenBalance: (userId, amount) => {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE wallets SET air_token_balance = air_token_balance + ? WHERE user_id = ?',
        [amount, userId],
        function (err) {
          if (err) reject(err);
          else resolve({ changed: this.changes });
        }
      );
    });
  },

  // Log a reward transaction
  logReward: (userId, submissionId, amount) => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO rewards (user_id, submission_id, amount) VALUES (?, ?, ?)',
        [userId, submissionId, amount],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  },

  // Get token balance for a user
  getTokenBalance: (userId) => {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT air_token_balance FROM wallets WHERE user_id = ?',
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row ? row.air_token_balance : 0);
        }
      );
    });
  },

  // Get unclaimed submissions for a user
  getUnclaimedSubmissions: (userId) => {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM submissions WHERE user_id = ? AND reward_claimed = FALSE ORDER BY submitted_at DESC',
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  },

  // Mark submission as claimed
  markSubmissionClaimed: (submissionId) => {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE submissions SET reward_claimed = TRUE WHERE id = ?',
        [submissionId],
        function (err) {
          if (err) reject(err);
          else resolve({ changed: this.changes });
        }
      );
    });
  },

  // Get submission by ID
  getSubmissionById: (submissionId) => {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM submissions WHERE id = ?',
        [submissionId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  },

  // Get all submissions
  getAllSubmissions: (limit = 100) => {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM submissions ORDER BY submitted_at DESC LIMIT ?',
        [limit],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            // Parse the data column from JSON
            const submissions = rows.map(row => {
              try {
                row.data = JSON.parse(row.data);
              } catch (e) {
                console.error(`Could not parse data for submission ${row.id}:`, e);
                row.data = {}; // Set to empty object on parse error
              }
              return row;
            });
            resolve(submissions);
          }
        }
      );
    });
  },
};

module.exports = database;

