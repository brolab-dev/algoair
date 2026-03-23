import axios from 'axios';

const TOPIC_ID = process.env.REACT_APP_HEDERA_TOPIC_ID || '0.0.8218381';
const MIRROR_NODE_URL = `https://testnet.mirrornode.hedera.com/api/v1/topics/${TOPIC_ID}/messages`;

class HederaService {
  constructor() {
    this.messages = [];
    this.subscribers = [];
    this.intervalId = null;
  }

  base64ToHex(b64) {
    try {
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return null;
    }
  }

  async enrichWithTransactions(items) {
    try {
      await Promise.all(items.map(async (item) => {
        if (!item.consensusTimestamp) return;
        const url = `https://testnet.mirrornode.hedera.com/api/v1/transactions`;
        const resp = await axios.get(url, { params: { timestamp: `eq:${item.consensusTimestamp}` } });
        const tx = resp.data?.transactions?.[0];
        if (tx) {
          item.transactionId = tx.transaction_id;
          item.transactionHash = tx.transaction_hash || null; // base64
          const hex = tx.transaction_hash ? this.base64ToHex(tx.transaction_hash) : null;
          if (hex) item.transactionHashHex = hex;
        }
      }));
    } catch (e) {
      // Non-fatal
      console.warn('Transaction enrichment skipped:', e?.message || e);
    }
  }

  async fetchMessages() {
    try {
      const response = await axios.get(MIRROR_NODE_URL, {
        params: { order: 'desc', limit: 100 },
      });
      const { messages } = response.data;

      const processedMessages = messages.map(msg => {
        try {
          // Messages are base64 encoded
          const decodedMessage = atob(msg.message);
          const jsonData = JSON.parse(decodedMessage);
          return {
            ...jsonData,
            topicId: TOPIC_ID,
            consensusTimestamp: msg.consensus_timestamp,
            sequenceNumber: msg.sequence_number,
          };
        } catch (error) {
          console.error('Error parsing message:', msg);
          return null;
        }
      }).filter(Boolean); // Filter out any nulls from parsing errors

      // keep
      this.messages = processedMessages;

      // try to enrich first page with tx data (non-blocking if fails)
      await this.enrichWithTransactions(this.messages.slice(0, 25));

      this.notifySubscribers(this.messages);

    } catch (error) {
      console.error('Failed to fetch messages from mirror node:', error);
    }
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    if (this.messages.length > 0) {
      callback(this.messages);
    }

    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  notifySubscribers(data) {
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }

  initialize() {
    // Fetch immediately on init
    this.fetchMessages();

    // Then poll every 10 seconds
    this.intervalId = setInterval(() => {
      this.fetchMessages();
    }, 10000);

    return true; // Indicate success
  }

  close() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.subscribers = [];
  }
}

const hederaServiceInstance = new HederaService();
export default hederaServiceInstance;

