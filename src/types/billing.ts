export type PaymentMethod = 'CASH' | 'UPI' | 'ONLINE' | 'CARD' | 'NETBANKING' | 'RAZORPAY';
export type PaymentStatus = 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUNDED';

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  [key: string]: any;
}

export interface Payment {
  id: string;
  studentProfileId?: string;
  studentName?: string;
  amount?: number;
  method?: PaymentMethod | string;
  status?: PaymentStatus | string;
  transactionId?: string;
  notes?: string;
  receiptNumber?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface CreatePaymentResponse {
  payment?: Payment;
  razorpayOrder?: RazorpayOrder;
  [key: string]: any;
}

export interface CollectionReport {
  totalCollected: number;
  totalPending?: number;
  cashCollected?: number;
  onlineCollected?: number;
  upiCollected?: number;
  count?: number;
  period?: string;
  [key: string]: any;
}

export interface CreatePaymentRequest {
  studentProfileId?: string;
  amount?: number;
  method?: PaymentMethod | string;
  notes?: string;
  shiftId?: string;
  seatId?: string;
  discountAmount?: number;
  durationMonths?: number;
  [key: string]: any;
}

export interface RazorpayVerificationRequest {
  id?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  transactionId?: string;
  [key: string]: any;
}
