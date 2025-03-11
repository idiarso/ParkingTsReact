import * as PDFDocument from 'pdfkit';
import * as XLSX from 'xlsx';
import { Receipt } from '../entities/Receipt';
import { ReceiptFormat } from '../types/receipt';
import { Readable } from 'stream';
import * as QRCode from 'qrcode';
import * as JsBarcode from 'jsbarcode';
import { Canvas } from 'canvas';

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

  private static formatDate(date: Date, format: string, locale: string): string {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  }

  private static formatCurrency(amount: number, currency: string, locale: string): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency
    }).format(amount);
  }

  static async generatePDF(receipt: Receipt, format: ReceiptFormat = {}): Promise<Buffer> {
    const options = { ...this.defaultFormat, ...format };
    
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
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
        doc.text(`Plate Number: ${receipt.plateNumber}`);
        doc.moveDown();

        // Parking details
        doc.text('Parking Details');
        doc.text(`Entry Time: ${this.formatDate(receipt.entryTime, options.dateFormat!, options.locale!)}`);
        doc.text(`Exit Time: ${this.formatDate(receipt.exitTime, options.dateFormat!, options.locale!)}`);
        doc.text(`Duration: ${receipt.duration}`);
        doc.moveDown();

        // Payment details
        doc.text('Payment Details');
        doc.text(`Base Rate: ${this.formatCurrency(receipt.baseRate, options.currency!, options.locale!)}`);
        doc.text(`Hourly Rate: ${this.formatCurrency(receipt.hourlyRate, options.currency!, options.locale!)}`);
        doc.text(`Subtotal: ${this.formatCurrency(receipt.subtotal, options.currency!, options.locale!)}`);
        
        if (receipt.overnightSurcharge > 0) {
          doc.text(`Overnight Surcharge: ${this.formatCurrency(receipt.overnightSurcharge, options.currency!, options.locale!)}`);
        }

        if (options.showVAT && options.vatRate) {
          const vat = receipt.total * (options.vatRate / 100);
          doc.text(`VAT (${options.vatRate}%): ${this.formatCurrency(vat, options.currency!, options.locale!)}`);
        }

        doc.text(`Total: ${this.formatCurrency(receipt.total, options.currency!, options.locale!)}`);
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
        ['Plate Number', receipt.plateNumber],
        [''],
        ['Parking Details'],
        ['Entry Time', this.formatDate(receipt.entryTime, options.dateFormat!, options.locale!)],
        ['Exit Time', this.formatDate(receipt.exitTime, options.dateFormat!, options.locale!)],
        ['Duration', receipt.duration],
        [''],
        ['Payment Details'],
        ['Base Rate', this.formatCurrency(receipt.baseRate, options.currency!, options.locale!)],
        ['Hourly Rate', this.formatCurrency(receipt.hourlyRate, options.currency!, options.locale!)],
        ['Subtotal', this.formatCurrency(receipt.subtotal, options.currency!, options.locale!)],
        ['Overnight Surcharge', this.formatCurrency(receipt.overnightSurcharge, options.currency!, options.locale!)],
        options.showVAT && options.vatRate ? 
          ['VAT', this.formatCurrency(receipt.total * (options.vatRate / 100), options.currency!, options.locale!)] : 
          [],
        ['Total', this.formatCurrency(receipt.total, options.currency!, options.locale!)],
        ['Payment Method', receipt.paymentMethod],
        ['Reference', receipt.paymentReference]
      ].filter(row => row.length > 0)
    };

    const worksheet = XLSX.utils.aoa_to_sheet(data['Receipt Information']);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Receipt');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
} 