import PDFDocument from 'pdfkit';
import XLSX from 'xlsx';
import { Receipt } from '../entities/Receipt';
import { ReceiptFormat } from '../types/receipt';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { Canvas } from 'canvas';
import { format } from 'date-fns';
import { enUS, id } from 'date-fns/locale';

interface ReceiptGeneratorOptions {
  dateFormat?: string;
  locale?: string;
  currency?: string;
  logo?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  showVAT?: boolean;
  vatRate?: number;
}

export class ReceiptGenerator {
  private static defaultFormat: ReceiptFormat = {
    showLogo: false,
    showBarcode: true,
    showQRCode: true,
    showVAT: false,
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '24h',
    locale: 'en-US',
    theme: {
      primaryColor: '#000000',
      secondaryColor: '#666666',
      fontFamily: 'Helvetica',
      fontSize: 12
    },
    footer: {
      text: 'Thank you for using our parking service!',
      showSocialMedia: false
    }
  };

  private defaultOptions: ReceiptGeneratorOptions = {
    dateFormat: 'dd MMM yyyy HH:mm:ss',
    locale: 'en-US',
    currency: 'IDR',
    companyName: 'Parking System',
    companyAddress: 'Jl. Parking No. 1',
    companyPhone: '(021) 123-4567',
    companyEmail: 'info@parking.com',
    companyWebsite: 'www.parking.com'
  };

  constructor(private options: ReceiptGeneratorOptions = {}) {
    this.options = { ...this.defaultOptions, ...options };
  }

  private static async generateQRCode(data: string): Promise<Buffer> {
    return QRCode.toBuffer(data);
  }

  private static generateBarcode(data: string): Buffer {
    const canvas = new Canvas(200, 100);
    JsBarcode(canvas, data, {
      format: 'CODE128',
      width: 2,
      height: 100,
      displayValue: true
    });
    return canvas.toBuffer();
  }

  private static formatDate(date: Date, dateFormat: string, locale: string): string {
    return format(date, dateFormat, {
      locale: locale === 'id' ? id : enUS
    });
  }

  private static formatCurrency(amount: number, locale: string = 'en-US', currency: string = 'USD'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  static async generatePDF(receipt: Receipt, format: ReceiptFormat = {}): Promise<Buffer> {
    const options = { ...this.defaultFormat, ...format };
    
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Company Logo
        if (options.showLogo && options.logoUrl) {
          doc.image(options.logoUrl, 50, 50, { width: 100 });
          doc.moveDown();
        }

        // Company Information
        if (options.companyName) {
          doc.fontSize(16).text(options.companyName, { align: 'center' });
          if (options.companyAddress) {
            doc.fontSize(10).text(options.companyAddress, { align: 'center' });
          }
          if (options.companyPhone) {
            doc.fontSize(10).text(options.companyPhone, { align: 'center' });
          }
          if (options.companyEmail) {
            doc.fontSize(10).text(options.companyEmail, { align: 'center' });
          }
          doc.moveDown();
        }

        // Header
        doc.fontSize(20).text('Parking Receipt', { align: 'center' });
        doc.moveDown();

        // Receipt details
        doc.fontSize(options.theme?.fontSize || 12);
        doc.text(`Receipt Number: ${receipt.receiptNumber}`);
        doc.text(`Date: ${this.formatDate(receipt.createdAt, options.dateFormat!, options.locale!)}`);
        doc.moveDown();

        // Customer information
        doc.text('Customer Information');
        doc.text(`Name: ${receipt.customerName || 'N/A'}`);
        doc.text(`Phone: ${receipt.customerPhone || 'N/A'}`);
        doc.text(`Email: ${receipt.customerEmail || 'N/A'}`);
        doc.moveDown();

        // Vehicle information
        doc.text('Vehicle Information');
        doc.text(`Type: ${receipt.vehicleType}`);
        doc.text(`License Plate: ${receipt.licensePlate}`);
        doc.moveDown();

        // Parking details
        doc.text('Parking Details');
        doc.text(`Entry Time: ${this.formatDate(receipt.entryTime, options.dateFormat!, options.locale!)}`);
        doc.text(`End Time: ${this.formatDate(receipt.endTime, options.dateFormat!, options.locale!)}`);
        doc.text(`Duration: ${receipt.duration}`);
        doc.moveDown();

        // Payment details
        doc.text('Payment Details');
        doc.text(`Base Rate: ${this.formatCurrency(receipt.baseRate, options.locale, options.currency)}`);
        doc.text(`Hourly Rate: ${this.formatCurrency(receipt.hourlyRate, options.locale, options.currency)}`);
        doc.text(`Subtotal: ${this.formatCurrency(receipt.subtotal, options.locale, options.currency)}`);
        
        if (receipt.overnightSurcharge > 0) {
          doc.text(`Overnight Surcharge: ${this.formatCurrency(receipt.overnightSurcharge, options.locale, options.currency)}`);
        }

        if (options.showVAT && options.vatRate) {
          const vat = receipt.total * (options.vatRate / 100);
          doc.text(`VAT (${options.vatRate}%): ${this.formatCurrency(vat, options.locale, options.currency)}`);
        }

        doc.text(`Total: ${this.formatCurrency(receipt.total, options.locale, options.currency)}`);
        doc.text(`Payment Method: ${receipt.paymentMethod}`);
        doc.text(`Reference: ${receipt.paymentReference}`);

        // Barcode and QR Code
        if (options.showBarcode) {
          const barcode = this.generateBarcode(receipt.receiptNumber);
          doc.image(barcode, { width: 200 });
        }

        if (options.showQRCode) {
          const qrCode = await this.generateQRCode(JSON.stringify({
            receiptNumber: receipt.receiptNumber,
            total: receipt.total,
            date: receipt.createdAt
          }));
          doc.image(qrCode, { width: 100 });
        }

        // Footer
        doc.moveDown();
        if (options.footer?.text) {
          doc.fontSize(10).text(options.footer.text, { align: 'center' });
        }

        if (options.footer?.showSocialMedia && options.footer?.socialLinks) {
          doc.moveDown();
          Object.entries(options.footer.socialLinks).forEach(([platform, url]) => {
            if (url) {
              doc.fontSize(8).text(`${platform}: ${url}`, { align: 'center' });
            }
          });
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  static generateExcel(receipt: Receipt, format: ReceiptFormat = {}): Buffer {
    const options = { ...this.defaultFormat, ...format };
    const workbook = XLSX.utils.book_new();
    
    const data = {
      'Receipt Information': [
        ['Receipt Number', receipt.receiptNumber],
        ['Date', this.formatDate(receipt.createdAt, options.dateFormat!, options.locale!)],
        [''],
        ['Company Information'],
        ['Name', options.companyName || ''],
        ['Address', options.companyAddress || ''],
        ['Phone', options.companyPhone || ''],
        ['Email', options.companyEmail || ''],
        [''],
        ['Customer Information'],
        ['Name', receipt.customerName || 'N/A'],
        ['Phone', receipt.customerPhone || 'N/A'],
        ['Email', receipt.customerEmail || 'N/A'],
        [''],
        ['Vehicle Information'],
        ['Type', receipt.vehicleType],
        ['License Plate', receipt.licensePlate],
        [''],
        ['Parking Details'],
        ['Entry Time', this.formatDate(receipt.entryTime, options.dateFormat!, options.locale!)],
        ['End Time', this.formatDate(receipt.endTime, options.dateFormat!, options.locale!)],
        ['Duration', receipt.duration],
        [''],
        ['Payment Details'],
        ['Base Rate', this.formatCurrency(receipt.baseRate, options.locale, options.currency)],
        ['Hourly Rate', this.formatCurrency(receipt.hourlyRate, options.locale, options.currency)],
        ['Subtotal', this.formatCurrency(receipt.subtotal, options.locale, options.currency)],
        ['Overnight Surcharge', this.formatCurrency(receipt.overnightSurcharge, options.locale, options.currency)],
        options.showVAT && options.vatRate ? 
          ['VAT', this.formatCurrency(receipt.total * (options.vatRate / 100), options.locale, options.currency)]: 
          [],
        ['Total', this.formatCurrency(receipt.total, options.locale, options.currency)],
        ['Payment Method', receipt.paymentMethod],
        ['Reference', receipt.paymentReference]
      ].filter(row => row.length > 0)
    };

    const worksheet = XLSX.utils.aoa_to_sheet(data['Receipt Information']);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Receipt');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  generateHTML(receipt: Receipt): string {
    const options = ReceiptGenerator.defaultFormat;
    const rows = [
      ['Receipt No', receipt.receiptNumber],
      ['Date', ReceiptGenerator.formatDate(receipt.createdAt, options.dateFormat!, options.locale!)],
      ['Email', receipt.customerEmail || 'N/A'],
      ['Vehicle Type', receipt.vehicleType],
      ['License Plate', receipt.licensePlate],
      ['Entry Time', ReceiptGenerator.formatDate(receipt.entryTime, options.dateFormat!, options.locale!)],
      ['End Time', ReceiptGenerator.formatDate(receipt.endTime, options.dateFormat!, options.locale!)],
      ['Duration', receipt.duration],
      ['Base Rate', ReceiptGenerator.formatCurrency(receipt.baseRate, options.locale, options.currency)],
      ['Hourly Rate', ReceiptGenerator.formatCurrency(receipt.hourlyRate, options.locale, options.currency)],
      ['Subtotal', ReceiptGenerator.formatCurrency(receipt.subtotal, options.locale, options.currency)],
      ['Overnight Surcharge', ReceiptGenerator.formatCurrency(receipt.overnightSurcharge, options.locale, options.currency)],
      ['Total', ReceiptGenerator.formatCurrency(receipt.total, options.locale, options.currency)],
      ['Payment Method', receipt.paymentMethod],
      ['Payment Reference', receipt.paymentReference]
    ];

    const tableRows = rows
      .map(([label, value]) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${label}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${value}</td>
        </tr>
      `)
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Parking Receipt</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .receipt-title {
              font-size: 20px;
              font-weight: bold;
              text-align: center;
              margin: 20px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              text-align: left;
              padding: 8px;
              border-bottom: 1px solid #ddd;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">${options.companyName}</div>
            <div>${options.companyAddress || ''}</div>
            <div>${options.companyPhone || ''}</div>
            <div>${options.companyEmail || ''}</div>
            <div>${options.companyWebsite || ''}</div>
          </div>
          <div class="receipt-title">PARKING RECEIPT</div>
          <table>
            ${tableRows}
          </table>
        </body>
      </html>
    `;
  }
} 