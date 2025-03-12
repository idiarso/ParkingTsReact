import React from 'react';
import { Box, Container, Typography, Paper, Tabs, Tab, Divider } from '@mui/material';
import { IPCameraConfig } from './IPCameraConfig';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`camera-tabpanel-${index}`}
      aria-labelledby={`camera-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `camera-tab-${index}`,
    'aria-controls': `camera-tabpanel-${index}`,
  };
}

export const CameraSettings: React.FC = () => {
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Camera Settings
        </Typography>
        
        <Paper sx={{ width: '100%' }}>
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="camera settings tabs"
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="IP Camera Configuration" {...a11yProps(0)} />
            <Tab label="OCR Settings" {...a11yProps(1)} />
            <Tab label="Performance" {...a11yProps(2)} />
          </Tabs>
          
          <Divider />
          
          <TabPanel value={value} index={0}>
            <IPCameraConfig />
          </TabPanel>
          
          <TabPanel value={value} index={1}>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                OCR Settings
              </Typography>
              <Typography variant="body1">
                Configure optical character recognition (OCR) settings for license plate detection.
                This feature will be available in a future update.
              </Typography>
            </Box>
          </TabPanel>
          
          <TabPanel value={value} index={2}>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Performance Settings
              </Typography>
              <Typography variant="body1">
                Configure performance settings for camera processing.
                This feature will be available in a future update.
              </Typography>
            </Box>
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
}; 