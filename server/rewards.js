require('dotenv').config();
const {
  AccountId,
  PrivateKey,
  Client,
  TokenId,
  TransferTransaction,
  TokenAssociateTransaction,
} = require('@hashgraph/sdk');
const database = require('./database');

// Hedera client setup
const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
const operatorKey = PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY);
const client = Client.forTestnet().setOperator(operatorId, operatorKey);

const AIR_TOKEN_ID = TokenId.fromString(process.env.AIR_TOKEN_ID);
const REWARD_AMOUNT = 10; // 0.10 AIR tokens (2 decimals)

// Transfer AIR tokens to a user
async function transferAARTokens(userAccountId, amount) {
  try {
    const transaction = new TransferTransaction()
      .addTokenTransfer(AIR_TOKEN_ID, operatorId, -amount)
      .addTokenTransfer(AIR_TOKEN_ID, userAccountId, amount)
      .freezeWith(client);

    const signTx = await transaction.sign(operatorKey);
    const txResponse = await signTx.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return receipt.status.toString();
  } catch (error) {
    console.error('Error transferring AIR tokens:', error);
    throw error;
  }
}

async function associateToken(userAccountId, userPrivateKey) {
  try {
    const transaction = new TokenAssociateTransaction()
      .setAccountId(userAccountId)
      .setTokenIds([AIR_TOKEN_ID])
      .freezeWith(client);

    const signTx = await transaction.sign(userPrivateKey);
    const txResponse = await signTx.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return receipt.status.toString();
  } catch (error) {
    console.error('Error associating token:', error);
    throw error;
  }
}

module.exports = {
  transferAARTokens,
  associateToken,
  REWARD_AMOUNT,
};
