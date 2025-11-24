import { createTheme } from '@mui/material/styles';

// Use a green primary to match the previous brand color #2d6a4f
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2d6a4f',
    },
    secondary: {
      main: '#19857b',
    },
    background: {
      default: '#f4f7f6',
    },
  },
  shape: {
    borderRadius: 12,
  },
});

export default theme;

