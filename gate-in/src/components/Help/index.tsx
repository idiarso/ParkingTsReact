import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  ExpandMore,
  DirectionsCar,
  PhotoCamera,
  Settings,
  Help as HelpIcon,
  Error,
  CheckCircle
} from '@mui/icons-material';

const Help: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Help & Documentation
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="body1" paragraph>
          Welcome to the Gate-In System help section. Here you'll find information about how to use the system
          and troubleshoot common issues.
        </Typography>
      </Paper>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6">Getting Started</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            <ListItem>
              <ListItemIcon>
                <DirectionsCar />
              </ListItemIcon>
              <ListItemText
                primary="Vehicle Entry Processing"
                secondary="Use the 'Process Vehicle Entry' menu to record new vehicles entering the parking area."
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <PhotoCamera />
              </ListItemIcon>
              <ListItemText
                primary="Camera Settings"
                secondary="Configure and test your camera settings for automated license plate detection."
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Settings />
              </ListItemIcon>
              <ListItemText
                primary="System Settings"
                secondary="Adjust system preferences and configurations."
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6">Common Issues</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            <ListItem>
              <ListItemIcon>
                <Error color="error" />
              </ListItemIcon>
              <ListItemText
                primary="Camera Not Detected"
                secondary="Ensure your camera is properly connected and enabled in your system settings."
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Error color="error" />
              </ListItemIcon>
              <ListItemText
                primary="OCR Not Working"
                secondary="Check your internet connection and ensure the camera is properly focused on the license plate."
              />
            </ListItem>
            <Divider sx={{ my: 1 }} />
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" />
              </ListItemIcon>
              <ListItemText
                primary="Best Practices"
                secondary="Position the camera at a 30-45 degree angle for optimal license plate recognition."
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6">Contact Support</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" paragraph>
            If you need additional assistance, please contact our support team:
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <HelpIcon />
              </ListItemIcon>
              <ListItemText
                primary="Technical Support"
                secondary="Email: support@parking-system.com"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <HelpIcon />
              </ListItemIcon>
              <ListItemText
                primary="Emergency Support"
                secondary="Phone: +1234567890 (24/7)"
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export { Help };
export default Help; 