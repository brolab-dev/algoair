import React from 'react';
import { Box, Typography } from '@mui/material';
import { getAqiLevel } from '../utils/aqiUtils';

const AqiGauge = ({ aqi }) => {
  const level = getAqiLevel(aqi);
  const val = Number(aqi);
  const displayVal = isNaN(val) ? '--' : val;

  // SVG circular gauge
  const size = 220;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // AQI 0-500 mapped to 0-100%
  const pct = Math.min((isNaN(val) ? 0 : val) / 500, 1);
  const offset = circumference * (1 - pct);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={level.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease' }}
          />
        </svg>
        {/* Center content */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              color: level.color,
              lineHeight: 1,
              fontSize: '3.5rem',
              transition: 'color 0.5s ease',
            }}
          >
            {displayVal}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.5 }}>
            US AQI
          </Typography>
        </Box>
      </Box>

      {/* Level label */}
      <Box
        sx={{
          mt: 2,
          px: 3,
          py: 0.75,
          borderRadius: 2,
          backgroundColor: level.color,
          transition: 'background-color 0.5s ease',
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#fff' }}>
          {level.label}
        </Typography>
      </Box>

      {/* Description */}
      <Typography
        variant="body2"
        sx={{ color: 'rgba(255,255,255,0.6)', mt: 1.5, maxWidth: 320, textAlign: 'center' }}
      >
        {level.description}
      </Typography>
    </Box>
  );
};

export default AqiGauge;
