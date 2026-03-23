import React from 'react';
import { useHederaData } from './hooks/useHederaData';
import Dashboard from './components/Dashboard';
import './App.css';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Chip,
  Box,
  Stack,
  Link,
  CircularProgress,
} from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import SensorsIcon from '@mui/icons-material/Sensors';

function App() {
  const { data, loading, error, connected, retry } = useHederaData();
  const topicId = process.env.REACT_APP_HEDERA_TOPIC_ID || '0.0.8218381';
  const hashscanTopicUrl = `https://hashscan.io/testnet/topic/${topicId}`;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'rgba(15, 18, 33, 0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <SensorsIcon sx={{ color: 'primary.main', fontSize: 28 }} />
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}
            >
              AirQuality
            </Typography>
            <Typography
              variant="caption"
              sx={{
                bgcolor: 'rgba(59,130,246,0.15)',
                color: 'primary.main',
                px: 1,
                py: 0.25,
                borderRadius: 1,
                fontWeight: 600,
                fontSize: '0.65rem',
              }}
            >
              HEDERA
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <Chip
              icon={
                <FiberManualRecordIcon
                  sx={{ fontSize: 10, color: connected ? '#10b981' : '#ef4444' }}
                />
              }
              label={connected ? 'Live' : 'Offline'}
              size="small"
              sx={{
                bgcolor: connected ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                color: connected ? '#10b981' : '#ef4444',
                border: '1px solid',
                borderColor: connected
                  ? 'rgba(16,185,129,0.2)'
                  : 'rgba(239,68,68,0.2)',
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
            />
            <Chip
              label={`Topic ${topicId}`}
              size="small"
              component={Link}
              clickable
              href={hashscanTopicUrl}
              target="_blank"
              rel="noopener"
              sx={{
                bgcolor: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.6)',
                border: '1px solid rgba(255,255,255,0.08)',
                fontWeight: 500,
                fontSize: '0.75rem',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            />
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {loading && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '60vh',
              gap: 2,
            }}
          >
            <CircularProgress size={48} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Connecting to Hedera network...
            </Typography>
          </Box>
        )}
        {error && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '60vh',
              gap: 2,
            }}
          >
            <Typography color="error" sx={{ mb: 1 }}>
              {error}
            </Typography>
            <Chip
              label="Retry Connection"
              onClick={retry}
              sx={{
                bgcolor: 'rgba(59,130,246,0.15)',
                color: 'primary.main',
                fontWeight: 600,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'rgba(59,130,246,0.25)' },
              }}
            />
          </Box>
        )}
        {!loading && !error && <Dashboard data={data} />}
      </Container>
    </Box>
  );
}

export default App;
