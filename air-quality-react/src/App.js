import React from 'react';
import { useHederaData } from './hooks/useHederaData';
import Dashboard from './components/Dashboard';
import './App.css';
import { AppBar, Toolbar, Typography, Container, Chip, Box, Stack, Link } from '@mui/material';

function App() {
  const { data, loading, error, connected, retry } = useHederaData();
  const topicId = process.env.REACT_APP_HEDERA_TOPIC_ID || '0.0.7257060';
  const hashscanTopicUrl = `https://hashscan.io/testnet/topic/${topicId}`;

  return (
    <div className="App">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Air Quality & Hedera
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={connected ? 'Connected' : 'Disconnected'}
              color={connected ? 'success' : 'error'}
              size="small"
              variant="filled"
            />
            <Chip
              label={`Topic ${topicId}`}
              size="small"
              component={Link}
              clickable
              href={hashscanTopicUrl}
              target="_blank"
              rel="noopener"
              variant="outlined"
            />
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg">
        <Box sx={{ my: 3 }}>
          {loading && <Typography>Loading data...</Typography>}
          {error && (
            <Box>
              <Typography color="error" sx={{ mb: 1 }}>Error: {error}</Typography>
              <Chip label="Retry" onClick={retry} variant="outlined" />
            </Box>
          )}
          {!loading && !error && <Dashboard data={data} />}
        </Box>
      </Container>
    </div>
  );
}

export default App;