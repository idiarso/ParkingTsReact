import React from 'react';
import {
  Paper,
  List,
  ListItem,
  ListItemText,
  Typography,
  Chip,
  Box,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { VehicleEntry } from '../services/api';

const StyledPaper = styled(Paper)(({ theme }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(2),
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  marginLeft: theme.spacing(1),
}));

interface RecentEntriesProps {
  entries: VehicleEntry[];
}

export const RecentEntries: React.FC<RecentEntriesProps> = ({ entries }) => {
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString();
  };

  return (
    <StyledPaper>
      <Typography variant="h6" gutterBottom>
        Recent Entries
      </Typography>
      <List>
        {entries.length === 0 ? (
          <ListItem>
            <ListItemText primary="No recent entries" />
          </ListItem>
        ) : (
          entries.map((entry) => (
            <ListItem key={entry.entryTime}>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center">
                    <Typography variant="body1" component="span">
                      {entry.plateNumber}
                    </Typography>
                    <StyledChip
                      label={entry.vehicleType}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                }
                secondary={`Entered at ${formatTime(entry.entryTime)}`}
              />
            </ListItem>
          ))
        )}
      </List>
    </StyledPaper>
  );
}; 