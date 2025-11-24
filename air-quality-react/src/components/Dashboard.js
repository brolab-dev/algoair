import DataCard from './DataCard';
import DataTable from './DataTable';
import DataMap from './DataMap';
import { Grid, Box, Typography, Paper } from '@mui/material';

const getValue = (s, key) => {
  if (s[key] != null) return s[key];
  if (s.data && s.data[key] != null) return s.data[key];
  return 'N/A';
};

const Dashboard = ({ data }) => {
  if (!data || data.length === 0) {
    return <Typography>No data available. Waiting for new submissions...</Typography>;
  }

  const latestData = data[0];
  const latestAqi = getValue(latestData, 'aqi');
  const latestTemp = getValue(latestData, 'temperature');

  return (
    <Box sx={{ py: 2 }}>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <DataCard title="Latest AQI" value={latestAqi} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DataCard title="Latest Temperature" value={latestTemp} unit="°C" />
        </Grid>
      </Grid>

      <Paper sx={{ p: 1, mb: 2 }} elevation={1}>
        <DataMap submissions={data} />
      </Paper>

      <Paper sx={{ p: 2 }} elevation={1}>
        <DataTable submissions={data} />
      </Paper>
    </Box>
  );
};

export default Dashboard;
