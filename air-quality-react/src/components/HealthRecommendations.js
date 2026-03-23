import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import AirIcon from '@mui/icons-material/Air';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import MasksIcon from '@mui/icons-material/Masks';
import { getHealthRecommendations } from '../utils/aqiUtils';

const iconMap = {
  window: AirIcon,
  outdoor: DirectionsRunIcon,
  mask: MasksIcon,
};

const HealthRecommendations = ({ aqi }) => {
  const recommendations = getHealthRecommendations(aqi);

  return (
    <Box>
      <Typography variant="h6" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
        Health Recommendations
      </Typography>
      <Grid container spacing={2}>
        {recommendations.map((rec, i) => {
          const Icon = iconMap[rec.icon] || AirIcon;
          return (
            <Grid item xs={12} sm={4} key={i}>
              <Paper
                sx={{
                  p: 2.5,
                  bgcolor: 'rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 2,
                  transition: 'background-color 0.2s ease',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                }}
                elevation={0}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    bgcolor: 'rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600 }}>
                    {rec.text}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>
                    {rec.detail}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default HealthRecommendations;
