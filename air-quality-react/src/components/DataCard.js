import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

const DataCard = ({ title, value, unit }) => {
  return (
    <Card elevation={2} sx={{ minWidth: 200 }}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" component="div" color="primary.main">
          {value} {unit && (
            <Typography component="span" variant="subtitle1" color="text.secondary" sx={{ ml: 1 }}>
              {unit}
            </Typography>
          )}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default DataCard;
