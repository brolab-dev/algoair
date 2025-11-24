import { useState, useEffect, useCallback } from 'react';
import hederaService from '../services/hederaService';

export const useHederaData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);

  const initializeConnection = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const success = await hederaService.initialize();
      if (success) {
        setConnected(true);
        
        // Subscribe to real-time updates
        const unsubscribe = hederaService.subscribe((newData) => {
          setData(newData);
          setLoading(false);
        });

        // Return cleanup function
        return unsubscribe;
      } else {
        throw new Error('Failed to connect to Hedera network');
      }
    } catch (err) {
      console.error('Error initializing Hedera connection:', err);
      setError(err.message);
      setConnected(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let unsubscribe;

    const setupConnection = async () => {
      unsubscribe = await initializeConnection();
    };

    setupConnection();

    // Cleanup on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [initializeConnection]);

  const retry = useCallback(() => {
    initializeConnection();
  }, [initializeConnection]);

  return {
    data,
    loading,
    error,
    connected,
    retry
  };
};
