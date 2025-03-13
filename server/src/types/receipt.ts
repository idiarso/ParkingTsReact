export interface ReceiptFormat {
  showLogo?: boolean;
  showBarcode?: boolean;
  showQRCode?: boolean;
  showVAT?: boolean;
  currency?: string;
  dateFormat?: string;
  timeFormat?: '12h' | '24h';
  locale?: string;
  vatRate?: number;
  logoUrl?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
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
      [key: string]: string;
    };
  };
}

export interface BatchDownloadOptions {
  dateRange?: {
    start: Date;
    end: Date;
  };
  plateNumber?: string;
  vehicleType?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  format?: 'pdf' | 'excel';
  receiptFormat?: ReceiptFormat;
} 