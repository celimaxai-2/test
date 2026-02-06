export interface ExtractedData {
  date: string;
  amount: string;
  merchant: string;
  productName: string;
  status: string;
  paymentMethod: string;
  transactionId: string;
}

export type ProcessingStatus = 'pending' | 'processing' | 'success' | 'error';

export interface ProcessedItem {
  id: string;
  file: File;
  previewUrl: string;
  status: ProcessingStatus;
  data: ExtractedData | null;
  error: string | null;
}
