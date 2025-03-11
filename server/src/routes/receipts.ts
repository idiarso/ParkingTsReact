import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { ReceiptController } from '../controllers/ReceiptController';

const router = Router();
const receiptController = new ReceiptController();

// Generate receipt for a parking session
router.post(
  '/generate/:parkingSessionId',
  authenticate,
  receiptController.generateReceipt.bind(receiptController)
);

// Get receipt by receipt number
router.get(
  '/:receiptNumber',
  authenticate,
  receiptController.getReceipt.bind(receiptController)
);

// Get receipts by plate number
router.get(
  '/',
  authenticate,
  receiptController.getUserReceipts.bind(receiptController)
);

// Download receipt as PDF or Excel with format options
router.get(
  '/:receiptNumber/download',
  authenticate,
  receiptController.getReceipt.bind(receiptController)
);

// Batch download receipts
router.post(
  '/batch-download',
  authenticate,
  receiptController.downloadBatch.bind(receiptController)
);

export default router; 