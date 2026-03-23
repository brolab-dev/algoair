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

// Hedera client setup (lazy-loaded to avoid crash if env vars are missing)
let _client, _operatorId, _operatorKey, _airTokenId;

function getClient() {
  if (!_client) {
    _operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
    _operatorKey = PrivateKey.fromStringDer(process.env.HEDERA_PRIVATE_KEY);
    _client = Client.forTestnet().setOperator(_operatorId, _operatorKey);
    _airTokenId = TokenId.fromString(process.env.AIR_TOKEN_ID);
  }
  return { client: _client, operatorId: _operatorId, operatorKey: _operatorKey, airTokenId: _airTokenId };
}
const REWARD_AMOUNT = 10; // 0.10 AIR tokens (2 decimals)

// Transfer AIR tokens to a user
async function transferAARTokens(userAccountId, amount) {
  try {
    const { client, operatorId, operatorKey, airTokenId } = getClient();
    const transaction = new TransferTransaction()
      .addTokenTransfer(airTokenId, operatorId, -amount)
      .addTokenTransfer(airTokenId, userAccountId, amount)
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
    const { client, airTokenId } = getClient();
    const transaction = new TokenAssociateTransaction()
      .setAccountId(userAccountId)
      .setTokenIds([airTokenId])
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
