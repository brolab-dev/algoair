import React from 'react';
import { Box, Typography, Paper, LinearProgress } from '@mui/material';

const PollutantCard = ({ label, value, unit, icon: Icon, max = 100, color = '#3b82f6' }) => {
  const numVal = Number(value);
  const pct = isNaN(numVal) ? 0 : Math.min((numVal / max) * 100, 100);
  const display = isNaN(numVal) ? '--' : numVal;

  return (
    <Paper
      sx={{
        p: 2.5,
        bgcolor: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 3,
        transition: 'background-color 0.2s ease',
        '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
      }}
      elevation={0}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {Icon && (
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                bgcolor: `${color}22`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon sx={{ color, fontSize: 20 }} />
            </Box>
          )}
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
            {label}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 1.5 }}>
        <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1 }}>
          {display}
        </Typography>
        {unit && (
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
            {unit}
          </Typography>
        )}
      </Box>

      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 6,
          borderRadius: 3,
          bgcolor: 'rgba(255,255,255,0.08)',
          '& .MuiLinearProgress-bar': {
            bgcolor: color,
            borderRadius: 3,
            transition: 'transform 0.8s ease',
          },
        }}
      />
    </Paper>
  );
};

export default PollutantCard;
