import React from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import { styled } from '@mui/material/styles';
import { format } from 'date-fns';

const PrintableBox = styled(Box)({
  '@media print': {
    width: '80mm', // Standard thermal receipt width
    padding: '5mm',
    margin: 0,
    backgroundColor: 'white',
    boxShadow: 'none',
  },
});

const PrintableTypography = styled(Typography)({
  '@media print': {
    color: 'black',
  },
});

interface ReceiptTemplateProps {
  receiptData: {
    parkingId: string;
    vehicleId: string;
    entryTime: Date;
    exitTime: Date;
    duration: string;
    baseRate: number;
    hourlyRate: number;
    totalAmount: number;
    vehicleType: string;
  };
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

const defaultCompanyInfo = {
  name: 'Parking Management System',
  address: '123 Parking Street',
  phone: '(123) 456-7890',
  email: 'info@parkingsystem.com',
};

const ReceiptTemplate: React.FC<ReceiptTemplateProps> = ({
  receiptData,
  companyInfo = defaultCompanyInfo,
}) => {
  return (
    <PrintableBox>
      <Paper sx={{ p: 3, '@media print': { boxShadow: 'none' } }}>
        {/* Header */}
        <Box textAlign="center" mb={2}>
          <PrintableTypography variant="h6">{companyInfo.name}</PrintableTypography>
          <PrintableTypography variant="body2">{companyInfo.address}</PrintableTypography>
          <PrintableTypography variant="body2">{companyInfo.phone}</PrintableTypography>
          <PrintableTypography variant="body2">{companyInfo.email}</PrintableTypography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Receipt Details */}
        <Box mb={2}>
          <PrintableTypography variant="body2" gutterBottom>
            Receipt No: {receiptData.parkingId}
          </PrintableTypography>
          <PrintableTypography variant="body2" gutterBottom>
            Date: {format(new Date(), 'dd/MM/yyyy HH:mm:ss')}
          </PrintableTypography>
          <PrintableTypography variant="body2" gutterBottom>
            Vehicle ID: {receiptData.vehicleId}
          </PrintableTypography>
          <PrintableTypography variant="body2" gutterBottom>
            Vehicle Type: {receiptData.vehicleType}
          </PrintableTypography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Parking Details */}
        <Box mb={2}>
          <PrintableTypography variant="body2" gutterBottom>
            Entry Time: {format(receiptData.entryTime, 'dd/MM/yyyy HH:mm:ss')}
          </PrintableTypography>
          <PrintableTypography variant="body2" gutterBottom>
            Exit Time: {format(receiptData.exitTime, 'dd/MM/yyyy HH:mm:ss')}
          </PrintableTypography>
          <PrintableTypography variant="body2" gutterBottom>
            Duration: {receiptData.duration}
          </PrintableTypography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Charges */}
        <Box mb={2}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <PrintableTypography variant="body2">Base Rate:</PrintableTypography>
            <PrintableTypography variant="body2">
              ${receiptData.baseRate.toFixed(2)}
            </PrintableTypography>
          </Box>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <PrintableTypography variant="body2">Hourly Rate:</PrintableTypography>
            <PrintableTypography variant="body2">
              ${receiptData.hourlyRate.toFixed(2)}
            </PrintableTypography>
          </Box>
          <Divider sx={{ my: 1 }} />
          <Box display="flex" justifyContent="space-between">
            <PrintableTypography variant="subtitle1">Total Amount:</PrintableTypography>
            <PrintableTypography variant="subtitle1">
              ${receiptData.totalAmount.toFixed(2)}
            </PrintableTypography>
          </Box>
        </Box>

        {/* Footer */}
        <Box textAlign="center" mt={3}>
          <PrintableTypography variant="body2">Thank you for using our service!</PrintableTypography>
          <PrintableTypography variant="body2">Please come again</PrintableTypography>
        </Box>
      </Paper>
    </PrintableBox>
  );
};

export default ReceiptTemplate; 