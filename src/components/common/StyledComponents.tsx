import { styled } from '@mui/material/styles';
import { Box, Paper, Typography } from '@mui/material';

// Styled Box components with proper TypeScript types
export const FlexBox = styled(Box)({
  display: 'flex',
});

export const CenteredFlexBox = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
});

export const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
}));

// Typography with proper types
export const PrintableTypography = styled(Typography)({
  margin: 0,
  padding: 0,
  '@media print': {
    color: '#000',
  },
});

// Box with proper types for receipt template
export const PrintableBox = styled(Box)({
  '@media print': {
    padding: '20px',
    margin: 0,
  },
}); 