import React from 'react';
import AqiGauge from './AqiGauge';
import HealthRecommendations from './HealthRecommendations';
import PollutantCard from './PollutantCard';
import AqiChart from './AqiChart';
import DataTable from './DataTable';
import DataMap from './DataMap';
import { Grid, Box, Typography, Paper } from '@mui/material';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import GrainIcon from '@mui/icons-material/Grain';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const getValue = (s, key) => {
  if (s[key] != null) return s[key];
  if (s.data && s.data[key] != null) return s.data[key];
  return 'N/A';
};

const formatTimestamp = (s) => {
  const ts = s?.consensusTimestamp;
  if (typeof ts === 'string') {
    const [sec] = ts.split('.');
    const ms = parseInt(sec, 10) * 1000;
    if (!isNaN(ms)) return new Date(ms).toLocaleString();
  }
  return 'Unknown';
};

const Dashboard = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <Typography variant="h6" sx={{ color: 'text.secondary' }}>
          No data available. Waiting for new submissions...
        </Typography>
      </Box>
    );
  }

  const latest = data[0];
  const aqi = getValue(latest, 'aqi');
  const temp = getValue(latest, 'temperature');
  const humidity = getValue(latest, 'humidity');
  const pm25 = getValue(latest, 'pm25');
  const lastUpdated = formatTimestamp(latest);

  return (
    <Box sx={{ py: 1 }}>
      {/* Hero Section - AQI Gauge */}
      <Paper
        sx={{
          p: { xs: 3, md: 5 },
          mb: 3,
          bgcolor: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 4,
          textAlign: 'center',
        }}
        elevation={0}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 3 }}>
          <AccessTimeIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }} />
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
            Last updated: {lastUpdated}
          </Typography>
        </Box>

        <AqiGauge aqi={aqi} />

        {/* Pollutant Cards */}
        <Grid container spacing={2} sx={{ mt: 4 }}>
          <Grid item xs={12} sm={4}>
            <PollutantCard
              label="PM2.5"
              value={pm25}
              unit="µg/m³"
              icon={GrainIcon}
              max={250}
              color="#f59e0b"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <PollutantCard
              label="Temperature"
              value={temp}
              unit="°C"
              icon={ThermostatIcon}
              max={50}
              color="#ef4444"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <PollutantCard
              label="Humidity"
              value={humidity}
              unit="%"
              icon={WaterDropIcon}
              max={100}
              color="#3b82f6"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Health Recommendations */}
      <Box sx={{ mb: 3 }}>
        <HealthRecommendations aqi={aqi} />
      </Box>

      {/* Chart + Map Row */}
      <Box
        sx={{
          display: 'flex',
          gap: 3,
          mb: 3,
          flexDirection: { xs: 'column', md: 'row' },
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <AqiChart submissions={data} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Paper
            sx={{
              bgcolor: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 3,
              overflow: 'hidden',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
            elevation={0}
          >
            <Typography
              variant="h6"
              sx={{ color: '#fff', p: 3, pb: 0, fontWeight: 600 }}
            >
              Sensor Map
            </Typography>
            <Box sx={{ flex: 1, minHeight: 300, p: 1.5 }}>
              <DataMap submissions={data} />
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Data Table */}
      <Paper
        sx={{
          p: 3,
          bgcolor: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 3,
        }}
        elevation={0}
      >
        <DataTable submissions={data} />
      </Paper>
    </Box>
  );
};

export default Dashboard;
