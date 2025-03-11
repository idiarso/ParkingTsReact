export interface ReceiptFormat {
  showLogo?: boolean;
  logoUrl?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  showBarcode?: boolean;
  showQRCode?: boolean;
  showVAT?: boolean;
  vatNumber?: string;
  vatRate?: number;
  currency?: string;
  dateFormat?: string;
  timeFormat?: string;
  locale?: string;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    fontSize?: number;
  };
  footer?: {
    text?: string;
    showSocialMedia?: boolean;
    socialLinks?: {
      facebook?: string;
      twitter?: string;
      instagram?: string;
    };
  };
}

export interface BatchDownloadOptions {
  format: 'pdf' | 'excel';
  dateRange?: {
    start: Date;
    end: Date;
  };
  plateNumber?: string;
  vehicleType?: string;
  status?: 'all' | 'paid' | 'unpaid';
  sortBy?: 'date' | 'amount' | 'plateNumber';
  sortOrder?: 'asc' | 'desc';
  receiptFormat?: ReceiptFormat;
} 