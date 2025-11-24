import { DataGrid } from '@mui/x-data-grid';
import { Typography, Box, Link, IconButton, Tooltip, Stack } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const formatTimestamp = (submission) => {
  const ts = submission.consensusTimestamp;
  if (typeof ts === 'string') {
    const [sec] = ts.split('.');
    const ms = parseInt(sec, 10) * 1000;
    if (!Number.isNaN(ms)) return new Date(ms).toLocaleString();
  }
  if (submission.submittedAt) {
    const d = new Date(submission.submittedAt);
    if (!isNaN(d)) return d.toLocaleString();
  }
  return '—';
};

const extractLocationString = (s) => {
  if (s?.latitude != null && s?.longitude != null) {
    return `${Number(s.latitude).toFixed(4)}, ${Number(s.longitude).toFixed(4)}`;
  }
  const loc = s?.location;
  if (!loc) return 'N/A';
  if (typeof loc === 'string') return loc;
  if (typeof loc === 'object') {
    const lat = loc.lat ?? loc.latitude;
    const lng = loc.lng ?? loc.longitude;
    if (lat != null && lng != null) {
      return `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`;
    }
  }
  return 'N/A';
};

const getValue = (s, key) => {
  if (!s) return '—';
  if (s[key] != null) return s[key];
  if (s.data && s.data[key] != null) return s.data[key];
  return '—';
};

const truncate = (str, n = 12) => (typeof str === 'string' && str.length > n ? `${str.slice(0, n)}…` : str || '—');

const DataTable = ({ submissions }) => {
  const rows = submissions.map((s, idx) => ({ id: s.sequenceNumber || idx, raw: s }));

  const columns = [
    {
      field: 'timestamp',
      headerName: 'Timestamp',
      flex: 1.1,
      valueGetter: (_value, row) => formatTimestamp(row.raw),
      sortable: true,
    },
    {
      field: 'location',
      headerName: 'Location',
      flex: 1,
      valueGetter: (_value, row) => extractLocationString(row.raw),
    },
    {
      field: 'aqi',
      headerName: 'AQI',
      flex: 0.6,
      valueGetter: (_value, row) => getValue(row.raw, 'aqi'),
      type: 'number',
    },
    {
      field: 'temperature',
      headerName: 'Temp (°C)',
      flex: 0.8,
      valueGetter: (_value, row) => getValue(row.raw, 'temperature'),
      type: 'number',
    },
    {
      field: 'humidity',
      headerName: 'Humidity (%)',
      flex: 0.9,
      valueGetter: (_value, row) => getValue(row.raw, 'humidity'),
      type: 'number',
    },
    {
      field: 'pm25',
      headerName: 'PM2.5 (µg/m³)',
      flex: 0.9,
      valueGetter: (_value, row) => getValue(row.raw, 'pm25'),
      type: 'number',
    },
    {
      field: 'message',
      headerName: 'Message',
      flex: 0.8,
      renderCell: (params) => {
        const s = params.row?.raw;
        const topicId = s?.topicId;
        const seq = s?.sequenceNumber;
        if (!topicId || !seq) return '—';
        const url = `https://hashscan.io/testnet/topic/${topicId}/message/${seq}`;
        return (
          <Link href={url} target="_blank" rel="noopener">#{seq}</Link>
        );
      },
      sortable: false,
    },
    {
      field: 'topic',
      headerName: 'Topic',
      flex: 1,
      valueGetter: (_value, row) => row.raw?.topicId || '—',
    },
    {
      field: 'txId',
      headerName: 'Tx ID',
      flex: 1.4,
      renderCell: (params) => {
        const id = params.row?.raw?.transactionId;
        if (!id) return '—';
        const url = `https://hashscan.io/testnet/transaction/${id}`;
        return (
          <Link href={url} target="_blank" rel="noopener">{id}</Link>
        );
      },
      sortable: false,
    },
    {
      field: 'txHash',
      headerName: 'Tx Hash',
      flex: 1.1,
      renderCell: (params) => {
        const hashHex = params.row?.raw?.transactionHashHex;
        if (!hashHex) return '—';
        return (
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography component="span" sx={{ fontFamily: 'monospace' }}>
              {truncate(hashHex, 14)}
            </Typography>
            <Tooltip title="Copy hash">
              <IconButton size="small" onClick={() => navigator.clipboard?.writeText(hashHex)}>
                <ContentCopyIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </Stack>
        );
      },
      sortable: false,
    },
  ];

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Recent Submissions
      </Typography>
      <div style={{ width: '100%' }}>
        <DataGrid
          autoHeight
          rows={rows}
          columns={columns}
          disableRowSelectionOnClick
          density="comfortable"
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[10, 25, 50]}
        />
      </div>
    </Box>
  );
};

export default DataTable;
