import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { getAqiColor } from '../utils/aqiUtils';

const getValue = (s, key) => {
  if (s[key] != null) return s[key];
  if (s.data && s.data[key] != null) return s.data[key];
  return undefined;
};

const formatTime = (ts) => {
  if (typeof ts === 'string') {
    const [sec] = ts.split('.');
    const ms = parseInt(sec, 10) * 1000;
    if (!isNaN(ms)) {
      const d = new Date(ms);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }
  return '';
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const aqi = payload[0]?.value;
  return (
    <Box
      sx={{
        bgcolor: '#1a1f36',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 1.5,
        p: 1.5,
      }}
    >
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: getAqiColor(aqi), fontWeight: 600 }}>
        AQI: {aqi}
      </Typography>
    </Box>
  );
};

const AqiChart = ({ submissions }) => {
  // Reverse so oldest is on left
  const chartData = [...submissions]
    .reverse()
    .map((s) => {
      const aqi = Number(getValue(s, 'aqi'));
      return {
        time: formatTime(s.consensusTimestamp),
        aqi: isNaN(aqi) ? null : aqi,
      };
    })
    .filter((d) => d.aqi !== null);

  if (chartData.length < 2) return null;

  return (
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
      <Typography variant="h6" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
        AQI History
      </Typography>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="time"
            stroke="rgba(255,255,255,0.3)"
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          />
          <YAxis
            stroke="rgba(255,255,255,0.3)"
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="aqi"
            stroke="#3b82f6"
            strokeWidth={2.5}
            fill="url(#aqiGradient)"
            dot={false}
            activeDot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default AqiChart;
