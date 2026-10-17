import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { formatTo12hString, calculateShiftDuration } from '../utils/dateUtils';
import {
  ReceiptText,
  Printer,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  QrCode,
  Banknote,
  Copy,
  Check,
  ShieldCheck,
} from 'lucide-react';

interface InvoiceReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  createdInvoiceData: any;
}

const receiptStyles = `
  .ir-receipt {
    --ir-primary: #1e40af;
    --ir-primary-light: #eff6ff;
    --ir-emerald: #059669;
    --ir-emerald-light: #ecfdf5;
    --ir-amber: #d97706;
    --ir-amber-light: #fffbeb;
    --ir-rose: #dc2626;
    --ir-rose-light: #fff1f2;
    --ir-border: #e2e8f0;
    --ir-text-dark: #0f172a;
    --ir-text-muted: #64748b;
    color: var(--ir-text-dark);
    width: 100%;
    min-width: 0;
    font-family: inherit;
  }
  .ir-receipt *, .ir-receipt *::before, .ir-receipt *::after {
    box-sizing: border-box;
  }
  .ir-paper {
    background: #ffffff;
    border: 1px solid var(--ir-border);
    border-radius: 16px;
    padding: 32px;
    box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
    position: relative;
    overflow: hidden;
  }
  .ir-paper::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: linear-gradient(90deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%);
  }

  /* Header Section */
  .ir-header {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--ir-border);
    align-items: flex-start;
  }
  .ir-brand-block {
    display: flex;
    gap: 14px;
    align-items: flex-start;
  }
  .ir-brand-logo {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
    flex-shrink: 0;
  }
  .ir-eyebrow {
    margin: 0 0 4px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--ir-text-muted);
  }
  .ir-brand-title {
    margin: 0 0 4px;
    font-size: 22px;
    font-weight: 800;
    line-height: 1.25;
    letter-spacing: -0.025em;
    color: var(--ir-text-dark);
  }
  .ir-brand-subtitle {
    margin: 0;
    color: var(--ir-text-muted);
    font-size: 12px;
    font-weight: 500;
  }
  .ir-branch-tag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-top: 8px;
    padding: 3px 10px;
    border-radius: 9999px;
    background: #f1f5f9;
    color: #334155;
    font-size: 11px;
    font-weight: 600;
  }

  /* Header Meta */
  .ir-meta {
    text-align: right;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
  }
  .ir-status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .ir-status-badge.paid {
    background: var(--ir-emerald-light);
    color: #065f46;
    border: 1px solid #a7f3d0;
  }
  .ir-status-badge.partial {
    background: var(--ir-amber-light);
    color: #92400e;
    border: 1px solid #fde68a;
  }
  .ir-status-badge.unpaid {
    background: var(--ir-rose-light);
    color: #991b1b;
    border: 1px solid #fecaca;
  }
  .ir-receipt-number {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 14px;
    font-weight: 700;
    color: var(--ir-text-dark);
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .ir-copy-btn {
    border: none;
    background: transparent;
    padding: 2px 4px;
    border-radius: 4px;
    cursor: pointer;
    color: var(--ir-text-muted);
    transition: all 0.2s;
  }
  .ir-copy-btn:hover {
    background: #e2e8f0;
    color: var(--ir-text-dark);
  }
  .ir-date-string {
    font-size: 11px;
    color: var(--ir-text-muted);
    font-weight: 500;
  }

  /* Two Column Profile Cards */
  .ir-info-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 20px;
    margin: 22px 0;
  }
  .ir-info-card {
    background: #f8fafc;
    border: 1px solid var(--ir-border);
    border-radius: 12px;
    padding: 16px 18px;
  }
  .ir-card-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ir-text-muted);
    margin-bottom: 10px;
  }
  .ir-card-title {
    margin: 0 0 8px;
    font-size: 15px;
    font-weight: 700;
    color: var(--ir-text-dark);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 6px;
  }
  .ir-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 10px;
    font-weight: 700;
    background: #e2e8f0;
    color: #1e293b;
  }
  .ir-pill.seat {
    background: #eff6ff;
    color: #1e40af;
    border: 1px solid #bfdbfe;
    font-size: 11px;
  }
  .ir-info-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 5px 0;
    font-size: 11.5px;
    color: #475569;
  }
  .ir-info-row svg {
    color: #94a3b8;
    flex-shrink: 0;
  }
  .ir-info-row strong {
    color: var(--ir-text-dark);
  }

  /* Table */
  .ir-table-wrapper {
    margin: 18px 0;
    border: 1px solid var(--ir-border);
    border-radius: 12px;
    overflow: hidden;
  }
  .ir-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    background: #ffffff;
  }
  .ir-table th {
    background: #f8fafc;
    padding: 12px 14px;
    border-bottom: 1px solid var(--ir-border);
    text-align: left;
    color: var(--ir-text-muted);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
  }
  .ir-table th:last-child {
    text-align: right;
    width: 140px;
  }
  .ir-table td {
    padding: 14px 14px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 12px;
    vertical-align: top;
  }
  .ir-table tr:last-child td {
    border-bottom: none;
  }
  .ir-table td:last-child {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .ir-item-title {
    font-weight: 700;
    color: var(--ir-text-dark);
    margin-bottom: 3px;
  }
  .ir-item-note {
    font-size: 11px;
    color: var(--ir-text-muted);
    line-height: 1.5;
  }
  .ir-item-price {
    font-weight: 700;
    font-size: 13px;
    color: var(--ir-text-dark);
  }
  .ir-discount-row td {
    background: #fafaf9;
    color: #15803d;
  }
  .ir-discount-row .ir-item-title {
    color: #15803d;
  }
  .ir-discount-row .ir-item-price {
    color: #15803d;
  }

  /* Financial Summary & Due Highlight */
  .ir-summary-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
    gap: 20px;
    margin-top: 18px;
    padding-top: 18px;
    border-top: 1px solid var(--ir-border);
    align-items: start;
  }
  .ir-payment-particulars {
    background: #f8fafc;
    border: 1px solid var(--ir-border);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .ir-payment-header {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ir-text-muted);
  }
  .ir-method-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    border-radius: 8px;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    font-weight: 700;
    font-size: 11px;
    color: #1e293b;
    width: fit-content;
  }
  .ir-txn-id {
    font-size: 11px;
    color: #475569;
    font-family: ui-monospace, monospace;
    overflow-wrap: anywhere;
  }
  .ir-security-note {
    margin-top: 4px;
    font-size: 10.5px;
    color: var(--ir-text-muted);
    line-height: 1.5;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  /* Calculation Box */
  .ir-calculation-box {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .ir-calc-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: #475569;
  }
  .ir-calc-row.subtotal {
    font-weight: 600;
    color: var(--ir-text-dark);
  }
  .ir-calc-row.discount {
    color: #16a34a;
    font-weight: 600;
  }
  .ir-calc-row.net-payable {
    padding-top: 6px;
    border-top: 1px dashed var(--ir-border);
    font-size: 13px;
    font-weight: 700;
    color: var(--ir-text-dark);
  }
  .ir-calc-row.amount-paid {
    font-size: 13px;
    font-weight: 700;
    color: #047857;
  }

  /* OUTSTANDING DUE CARD */
  .ir-due-banner {
    margin-top: 8px;
    border-radius: 12px;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    transition: all 0.2s;
  }
  .ir-due-banner.has-due {
    background: #fff7ed;
    border: 1.5px solid #fdba74;
    color: #9a3412;
    box-shadow: 0 2px 10px rgba(234, 88, 12, 0.08);
  }
  .ir-due-banner.no-due {
    background: #f0fdf4;
    border: 1.5px solid #86efac;
    color: #166534;
  }
  .ir-due-banner-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .ir-due-banner-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .ir-due-banner-amount {
    font-size: 20px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }
  .ir-due-banner.has-due .ir-due-banner-amount {
    color: #c2410c;
  }
  .ir-due-banner.no-due .ir-due-banner-amount {
    color: #15803d;
  }
  .ir-due-banner-desc {
    margin: 0;
    font-size: 10.5px;
    opacity: 0.9;
    line-height: 1.4;
  }

  /* Footer & Signature Section */
  .ir-footer-section {
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid var(--ir-border);
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
    gap: 20px;
    align-items: flex-end;
  }
  .ir-terms-list {
    margin: 0;
    padding-left: 16px;
    font-size: 10px;
    color: var(--ir-text-muted);
    line-height: 1.6;
  }
  .ir-terms-title {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ir-text-dark);
    margin-bottom: 4px;
  }
  .ir-signatory-box {
    text-align: right;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }
  .ir-signature-line {
    width: 160px;
    height: 1px;
    background: #94a3b8;
    margin-bottom: 6px;
  }
  .ir-signatory-name {
    font-size: 11px;
    font-weight: 700;
    color: var(--ir-text-dark);
  }
  .ir-signatory-title {
    font-size: 10px;
    color: var(--ir-text-muted);
  }
  .ir-seal-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: 6px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #2563eb;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    padding: 3px 8px;
    border-radius: 4px;
  }

  /* Screen Action Buttons */
  .ir-actions-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding-top: 20px;
  }
  .ir-actions-note {
    margin: 0;
    font-size: 11.5px;
    color: var(--ir-text-muted);
  }
  .ir-action-btns {
    display: flex;
    gap: 10px;
  }

  /* Mobile Responsive */
  @media screen and (max-width: 640px) {
    .ir-paper {
      padding: 20px;
      border-radius: 12px;
    }
    .ir-header {
      grid-template-columns: minmax(0, 1fr);
      gap: 16px;
    }
    .ir-meta {
      text-align: left;
      align-items: flex-start;
    }
    .ir-info-grid {
      grid-template-columns: minmax(0, 1fr);
      gap: 14px;
    }
    .ir-summary-grid {
      grid-template-columns: minmax(0, 1fr);
      gap: 16px;
    }
    .ir-footer-section {
      grid-template-columns: minmax(0, 1fr);
      gap: 16px;
    }
    .ir-signatory-box {
      align-items: flex-start;
      text-align: left;
    }
    .ir-actions-bar {
      flex-direction: column;
      align-items: stretch;
    }
    .ir-action-btns {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
  }

  /* Print Stylesheet */
  @media print {
    @page {
      margin: 10mm;
      size: A4 portrait;
    }
    html, body {
      height: auto !important;
      overflow: visible !important;
      background: #ffffff !important;
      color: #000000 !important;
    }
    body * {
      visibility: hidden !important;
    }
    body > *:not(:has(#studyflow-invoice-print-area)):not(style):not(script) {
      display: none !important;
    }
    .modal-overlay:has(#studyflow-invoice-print-area),
    .modal-container:has(#studyflow-invoice-print-area),
    .modal-body:has(#studyflow-invoice-print-area),
    .ir-receipt {
      display: block !important;
      position: static !important;
      inset: auto !important;
      transform: none !important;
      width: 100% !important;
      max-width: none !important;
      min-height: 0 !important;
      height: auto !important;
      max-height: none !important;
      overflow: visible !important;
      padding: 0 !important;
      margin: 0 !important;
      border: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      background: #ffffff !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      animation: none !important;
      opacity: 1 !important;
    }
    .modal-container:has(#studyflow-invoice-print-area) > .modal-header,
    .modal-container:has(#studyflow-invoice-print-area) > .modal-footer,
    .ir-actions-bar {
      display: none !important;
    }
    #studyflow-invoice-print-area, #studyflow-invoice-print-area * {
      visibility: visible !important;
    }
    #studyflow-invoice-print-area {
      position: static !important;
      width: 100% !important;
      padding: 16px !important;
      margin: 0 auto !important;
      border: 1px solid #cbd5e1 !important;
      border-radius: 8px !important;
      box-shadow: none !important;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
    .ir-header, .ir-info-grid, .ir-table-wrapper, .ir-summary-grid, .ir-footer-section {
      break-inside: avoid;
    }
    .ir-table thead {
      display: table-header-group;
    }
  }
`;

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({
  isOpen,
  onClose,
  createdInvoiceData,
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [copied, setCopied] = useState(false);
  const [copiedTxn, setCopiedTxn] = useState(false);

  if (!createdInvoiceData) return null;

  const workspaceName =
    user?.workspace?.name ||
    createdInvoiceData.workspaceName ||
    'StudyFlow Reading Space';

  // Extract student details safely
  const student = createdInvoiceData.student || createdInvoiceData.studentProfile || {};
  const studentUser = student.user || {};
  const studentName =
    studentUser.name ||
    student.name ||
    'Registered Member';
  const studentMobile =
    studentUser.mobile ||
    student.mobile ||
    'N/A';
  const studentEmail =
    studentUser.email ||
    student.email ||
    'N/A';
  const studentRegId = student.id
    ? `STD-${student.id.slice(0, 6).toUpperCase()}`
    : 'STD-GENERAL';

  // Extract seat & shift details
  const seatNumber =
    createdInvoiceData.seatNumber ||
    createdInvoiceData.seat?.number ||
    student.seatNumber ||
    student.activeAllocation?.seat?.number ||
    'N/A';
  const shift = createdInvoiceData.shift || student.activeAllocation?.shift || {};
  const shiftName = shift.name || 'Standard Shift';
  const shiftTiming =
    shift.startTime && shift.endTime
      ? `${formatTo12hString(shift.startTime)} - ${formatTo12hString(shift.endTime)}`
      : '';
  const shiftDuration =
    shift.startTime && shift.endTime
      ? calculateShiftDuration(shift.startTime, shift.endTime)
      : '';

  // Dates
  const startDateStr = createdInvoiceData.startDate || createdInvoiceData.payment?.createdAt || Date.now();
  const endDateStr = createdInvoiceData.endDate || startDateStr;
  const formattedStartDate = new Date(startDateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const formattedEndDate = new Date(endDateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Payment record
  const payment = createdInvoiceData.payment || {};
  const invoiceNumber = payment.receiptNumber
    ? payment.receiptNumber
    : payment.id
    ? `REC-${payment.id.substring(0, 8).toUpperCase()}`
    : `REC-${Date.now().toString().slice(-6)}`;

  const paymentDate = new Date(payment.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const paymentTime = new Date(payment.createdAt || Date.now()).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const paymentMethod = (payment.method || createdInvoiceData.paymentMethod || 'CASH').toUpperCase();
  const transactionId = payment.transactionId || payment.razorpay_payment_id || null;

  // FINANCIAL BREAKDOWN CALCULATIONS
  // 1. Gross / Base amount before discount
  const rawOriginal = Number(
    createdInvoiceData.originalAmount ??
    payment.totalAmount ??
    createdInvoiceData.totalAmount ??
    0
  );

  // 2. Discount amount
  const discountAmount = Math.max(
    0,
    Number(
      createdInvoiceData.discountAmount ??
      payment.discountAmount ??
      0
    )
  );

  // 3. Paid amount right now
  const paidAmount = Math.max(
    0,
    Number(
      createdInvoiceData.paidAmount ??
      payment.amount ??
      0
    )
  );

  // 4. Net payable calculation
  let payableAmount = 0;
  if (createdInvoiceData.payableAmount !== undefined && createdInvoiceData.payableAmount !== null) {
    payableAmount = Math.max(0, Number(createdInvoiceData.payableAmount));
  } else if (rawOriginal > 0) {
    payableAmount = Math.max(0, rawOriginal - discountAmount);
  } else {
    payableAmount = paidAmount;
  }

  // Final base fee display
  const baseFee = rawOriginal > 0 ? rawOriginal : payableAmount + discountAmount;

  // 5. DUE AMOUNT (CORE USER REQUIREMENT)
  let dueAmount = 0;
  if (createdInvoiceData.dueAmount !== undefined && createdInvoiceData.dueAmount !== null) {
    dueAmount = Math.max(0, Number(createdInvoiceData.dueAmount));
  } else if (payment.dueAmount !== undefined && payment.dueAmount !== null) {
    dueAmount = Math.max(0, Number(payment.dueAmount));
  } else if (student.dueAmount !== undefined && student.dueAmount !== null) {
    dueAmount = Math.max(0, Number(student.dueAmount));
  } else {
    dueAmount = Math.max(0, payableAmount - paidAmount);
  }

  // Payment status
  const isFullyPaid = dueAmount <= 0.01;
  const isPartial = !isFullyPaid && paidAmount > 0;
  const isUnpaid = !isFullyPaid && paidAmount <= 0;

  const statusType = isFullyPaid ? 'paid' : isPartial ? 'partial' : 'unpaid';
  const statusLabel = isFullyPaid
    ? 'PAID IN FULL'
    : isPartial
    ? `PARTIAL (DUE ₹${dueAmount.toFixed(0)})`
    : 'UNPAID';

  const branchName = createdInvoiceData.branchName || user?.branch?.name || '';

  const handleCopyReceiptNumber = () => {
    navigator.clipboard.writeText(invoiceNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyTxnId = () => {
    if (!transactionId) return;
    navigator.clipboard.writeText(transactionId);
    setCopiedTxn(true);
    setTimeout(() => setCopiedTxn(false), 2000);
  };

  const handleCopyWhatsAppSummary = () => {
    const message =
      `*${workspaceName} - Fee Receipt*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🧾 *Receipt No:* ${invoiceNumber}\n` +
      `📅 *Date:* ${paymentDate} (${paymentTime})\n` +
      `👤 *Student:* ${studentName} (${studentMobile})\n` +
      `🪑 *Seat:* ${seatNumber} | ${shiftName}\n` +
      `🗓️ *Period:* ${formattedStartDate} to ${formattedEndDate}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `• *Total Fee:* ₹${payableAmount.toFixed(2)}\n` +
      `• *Amount Paid:* ₹${paidAmount.toFixed(2)} (${paymentMethod})\n` +
      `• *Remaining Due:* ₹${dueAmount.toFixed(2)}\n` +
      `• *Status:* ${statusLabel}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Thank you for studying with us!`;

    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Fee Receipt & Tax Invoice" maxWidth="lg">
      <div className="ir-receipt">
        <style>{receiptStyles}</style>

        {/* Printable Receipt Paper */}
        <article
          id="studyflow-invoice-print-area"
          className="ir-paper"
          aria-label="Official Fee Receipt and Invoice"
        >
          {/* Header */}
          <header className="ir-header">
            <div className="ir-brand-block">
              <div className="ir-brand-logo">
                <ReceiptText size={24} />
              </div>
              <div>
                <p className="ir-eyebrow">Official Fee Receipt & Invoice</p>
                <h2 className="ir-brand-title">{workspaceName}</h2>
                <p className="ir-brand-subtitle">Reading Room & Study Space Management</p>
                {branchName && (
                  <div className="ir-branch-tag">
                    <MapPin size={11} />
                    <span>Branch: {branchName}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="ir-meta">
              <span className={`ir-status-badge ${statusType}`}>
                {isFullyPaid && <CheckCircle2 size={13} />}
                {isPartial && <Clock size={13} />}
                {isUnpaid && <AlertCircle size={13} />}
                <span>{statusLabel}</span>
              </span>

              <div className="ir-receipt-number">
                <span>{invoiceNumber}</span>
                <button
                  type="button"
                  className="ir-copy-btn"
                  title="Copy receipt number"
                  onClick={handleCopyReceiptNumber}
                >
                  {copied ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                </button>
              </div>

              <div className="ir-date-string">
                Date: {paymentDate} · {paymentTime}
              </div>
            </div>
          </header>

          {/* Student & Booking Details Cards */}
          <div className="ir-info-grid">
            {/* Card 1: Student / Subscriber */}
            <section className="ir-info-card" aria-label="Student Information">
              <div className="ir-card-header">
                <User size={13} />
                <span>Billed To / Student Details</span>
              </div>
              <div className="ir-card-title">
                <span>{studentName}</span>
                <span className="ir-pill">{studentRegId}</span>
              </div>
              <div className="ir-info-row">
                <Phone size={12} />
                <span>Phone: <strong>{studentMobile}</strong></span>
              </div>
              <div className="ir-info-row">
                <Mail size={12} />
                <span>Email: {studentEmail}</span>
              </div>
            </section>

            {/* Card 2: Seat & Shift Allocation */}
            <section className="ir-info-card" aria-label="Subscription Booking Details">
              <div className="ir-card-header">
                <Calendar size={13} />
                <span>Booking & Seat Allocation</span>
              </div>
              <div className="ir-card-title">
                <span className="ir-pill seat">Seat #{seatNumber}</span>
                <span style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>
                  {shiftName}
                </span>
              </div>
              {shiftTiming && (
                <div className="ir-info-row">
                  <Clock size={12} />
                  <span>Timings: <strong>{shiftTiming}</strong> {shiftDuration && `(${shiftDuration})`}</span>
                </div>
              )}
              <div className="ir-info-row">
                <Calendar size={12} />
                <span>Period: <strong>{formattedStartDate}</strong> to <strong>{formattedEndDate}</strong></span>
              </div>
            </section>
          </div>

          {/* Itemized Table */}
          <div className="ir-table-wrapper">
            <table className="ir-table" aria-label="Itemized Charges">
              <thead>
                <tr>
                  <th scope="col" style={{ width: '45%' }}>Description & Particulars</th>
                  <th scope="col">Shift / Timings</th>
                  <th scope="col">Subscription Validity</th>
                  <th scope="col">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div className="ir-item-title">Library Seat Subscription Fee</div>
                    <div className="ir-item-note">
                      Seat #{seatNumber} · Dedicated Study Space Allocation
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{shiftName}</span>
                    {shiftTiming && (
                      <div className="ir-item-note">{shiftTiming}</div>
                    )}
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{formattedStartDate}</span>
                    <div className="ir-item-note">to {formattedEndDate}</div>
                  </td>
                  <td className="ir-item-price">
                    ₹{baseFee.toFixed(2)}
                  </td>
                </tr>

                {discountAmount > 0 && (
                  <tr className="ir-discount-row">
                    <td colSpan={3}>
                      <div className="ir-item-title">Concession / Promotional Discount</div>
                      <div className="ir-item-note" style={{ color: '#16a34a' }}>
                        Fee concession applied on this booking
                      </div>
                    </td>
                    <td className="ir-item-price">
                      -₹{discountAmount.toFixed(2)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Financial Summary & Due Highlight Grid */}
          <div className="ir-summary-grid">
            {/* Left: Payment Method Details */}
            <div className="ir-payment-particulars">
              <span className="ir-payment-header">Payment Mode & Verification</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span className="ir-method-badge">
                  {paymentMethod === 'CASH' && <Banknote size={14} color="#059669" />}
                  {paymentMethod === 'UPI' && <QrCode size={14} color="#2563eb" />}
                  {(paymentMethod === 'CARD' || paymentMethod === 'ONLINE' || paymentMethod === 'RAZORPAY') && (
                    <CreditCard size={14} color="#7c3aed" />
                  )}
                  <span>{paymentMethod}</span>
                </span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Recorded on {paymentDate}
                </span>
              </div>

              {transactionId && (
                <div style={{ marginTop: '2px' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Transaction Reference:
                  </div>
                  <div className="ir-txn-id" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{transactionId}</span>
                    <button
                      type="button"
                      className="ir-copy-btn"
                      title="Copy transaction ID"
                      onClick={handleCopyTxnId}
                    >
                      {copiedTxn ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              )}

              <div className="ir-security-note">
                <ShieldCheck size={13} color="#059669" />
                <span>Digitally acknowledged in {workspaceName} library ledger.</span>
              </div>
            </div>

            {/* Right: Calculations & DUE AMOUNT BANNER */}
            <div className="ir-calculation-box">
              <div className="ir-calc-row subtotal">
                <span>Gross Subscription Fee:</span>
                <span>₹{baseFee.toFixed(2)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="ir-calc-row discount">
                  <span>Discount / Concession:</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="ir-calc-row net-payable">
                <span>Total Net Payable:</span>
                <span>₹{payableAmount.toFixed(2)}</span>
              </div>

              <div className="ir-calc-row amount-paid">
                <span>Amount Paid Now:</span>
                <span>₹{paidAmount.toFixed(2)}</span>
              </div>

              {/* HIGHLIGHTED DUE AMOUNT / BALANCE CALLOUT */}
              {dueAmount > 0 ? (
                <div className="ir-due-banner has-due">
                  <div className="ir-due-banner-head">
                    <span className="ir-due-banner-title">
                      <AlertCircle size={15} />
                      <span>Remaining Balance Due</span>
                    </span>
                    <span className="ir-due-banner-amount">₹{dueAmount.toFixed(2)}</span>
                  </div>
                  <p className="ir-due-banner-desc">
                    Outstanding balance pending from student. Settle on or before next renewal.
                  </p>
                </div>
              ) : (
                <div className="ir-due-banner no-due">
                  <div className="ir-due-banner-head">
                    <span className="ir-due-banner-title">
                      <CheckCircle2 size={15} />
                      <span>Payment Settled in Full</span>
                    </span>
                    <span className="ir-due-banner-amount">₹0.00 (Nil Due)</span>
                  </div>
                  <p className="ir-due-banner-desc">
                    All dues for this subscription period have been cleared successfully.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Terms & Authorized Signature */}
          <footer className="ir-footer-section">
            <div>
              <div className="ir-terms-title">Terms & Conditions</div>
              <ol className="ir-terms-list">
                <li>This computer-generated receipt serves as official proof of payment.</li>
                <li>Subscriptions are non-transferable and subject to library code of conduct.</li>
                <li>Please retain this receipt or digital copy for seat access verification.</li>
              </ol>
            </div>

            <div className="ir-signatory-box">
              <div className="ir-signature-line" />
              <div className="ir-signatory-name">Authorized Signatory</div>
              <div className="ir-signatory-title">{workspaceName}</div>
              <div className="ir-seal-badge">
                <ShieldCheck size={11} />
                <span>Verified Digital Receipt</span>
              </div>
            </div>
          </footer>
        </article>

        {/* Screen Action Bar */}
        <div className="ir-actions-bar">
          <p className="ir-actions-note">
            Print an official copy or save as PDF from the print dialog.
          </p>
          <div className="ir-action-btns">
            <Button
              variant="outline"
              onClick={handleCopyWhatsAppSummary}
              title="Copy receipt summary for WhatsApp or SMS"
            >
              {copied ? <Check size={15} color="#16a34a" /> : <Copy size={15} />}
              <span>{copied ? 'Copied Summary!' : 'Copy Summary'}</span>
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                window.print();
              }}
              style={{
                backgroundColor: '#1e40af',
                borderColor: '#1e40af',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Printer size={15} />
              <span>Print Receipt</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
