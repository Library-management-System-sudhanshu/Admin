import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { formatTo12hString, calculateShiftDuration } from '../utils/dateUtils';

interface InvoiceReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  createdInvoiceData: any;
}

// Styles belong to this receipt only; shared Modal and Button files stay unchanged.
const receiptStyles = `
  .ir-receipt { --ir-blue: var(--accent-blue, #2563eb); color: #0f172a; width: 100%; min-width: 0; }
  .ir-receipt *, .ir-receipt *::before, .ir-receipt *::after { box-sizing: border-box; }
  .ir-paper { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 28px; border-top: 4px solid var(--ir-blue); }
  .ir-header { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 24px; padding-bottom: 22px; border-bottom: 1px solid #e2e8f0; }
  .ir-eyebrow { margin: 0 0 8px; font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #64748b; }
  .ir-brand { margin: 0 0 7px; font-size: 22px; font-weight: 800; line-height: 1.25; letter-spacing: -.035em; overflow-wrap: anywhere; }
  .ir-subtitle { margin: 0; color: #64748b; font-size: 12px; line-height: 1.6; }
  .ir-branch { margin: 8px 0 0; color: #475569; font-size: 12px; overflow-wrap: anywhere; }
  .ir-meta { text-align: right; min-width: 0; }
  .ir-status { display: inline-flex; align-items: center; gap: 6px; padding: 5px 9px; border-radius: 6px; border: 1px solid #fecaca; background: #fff1f2; color: #b91c1c; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 12px; }
  .ir-status[data-paid="true"] { background: #ecfdf5; border-color: #a7f3d0; color: #047857; }
  .ir-status::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
  .ir-number { font-size: 13px; font-weight: 700; letter-spacing: .025em; overflow-wrap: anywhere; }
  .ir-date { margin-top: 5px; font-size: 11px; color: #64748b; line-height: 1.5; }
  .ir-details { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 22px; padding: 22px 0; }
  .ir-details > section { min-width: 0; }
  .ir-details > section + section { border-left: 1px solid #e2e8f0; padding-left: 22px; }
  .ir-section-title { margin: 0 0 10px; font-size: 10px; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; color: #64748b; }
  .ir-name { margin: 0 0 10px; font-size: 15px; font-weight: 700; line-height: 1.4; overflow-wrap: anywhere; }
  .ir-detail-row { display: grid; grid-template-columns: 52px minmax(0, 1fr); gap: 8px; margin: 5px 0; font-size: 11px; line-height: 1.65; }
  .ir-detail-row > span:first-child { color: #64748b; }
  .ir-detail-row > span:last-child { color: #334155; overflow-wrap: anywhere; }
  .ir-shift-time { display: block; color: #64748b; }
  .ir-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .ir-table th { background: #f8fafc; padding: 10px 12px; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; text-align: left; color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: .06em; font-weight: 700; }
  .ir-table th:last-child, .ir-table td:last-child { width: 130px; text-align: right; font-variant-numeric: tabular-nums; }
  .ir-table td { padding: 15px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top; font-size: 12px; line-height: 1.5; overflow-wrap: anywhere; }
  .ir-item-title { font-weight: 600; margin-bottom: 4px; }
  .ir-item-note { font-size: 11px; color: #64748b; line-height: 1.6; }
  .ir-amount { font-weight: 600; }
  .ir-adjustment td { padding-top: 10px; padding-bottom: 10px; color: #475569; }
  .ir-total { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px; margin-top: 16px; border: 1px solid #dbeafe; border-radius: 10px; background: #eff6ff; }
  .ir-total-label { font-size: 12px; font-weight: 600; line-height: 1.5; }
  .ir-total-value { color: var(--ir-blue); font-size: 26px; font-weight: 800; letter-spacing: -.035em; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; min-width: 0; text-align: right; }
  .ir-payment { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 20px; margin-top: 20px; padding-top: 16px; border-top: 1px dashed #cbd5e1; }
  .ir-payment-label { margin: 0 0 5px; font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: .07em; font-weight: 700; }
  .ir-payment-value { margin: 0; font-size: 12px; font-weight: 600; overflow-wrap: anywhere; line-height: 1.5; }
  .ir-thanks { margin: 20px 0 0; color: #64748b; font-size: 11px; text-align: center; line-height: 1.6; overflow-wrap: anywhere; }
  .ir-actions { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-top: 18px; }
  .ir-actions-note { margin: 0; color: #64748b; font-size: 11px; line-height: 1.5; }
  .ir-action-buttons { display: flex; gap: 8px; flex-shrink: 0; }
  .ir-action-buttons .custom-button { min-height: 42px; border-radius: 9px; font-size: 12px; }
  .ir-action-buttons .btn-primary { background: var(--ir-blue); border-color: var(--ir-blue); }
  @media screen and (max-width: 520px) {
    .ir-paper { padding: 18px; border-radius: 10px; }
    .ir-header { grid-template-columns: minmax(0, 1fr); gap: 14px; padding-bottom: 18px; }
    .ir-brand { font-size: 20px; }
    .ir-meta { text-align: left; }
    .ir-status { margin-bottom: 8px; }
    .ir-details { grid-template-columns: minmax(0, 1fr); gap: 18px; padding: 18px 0; }
    .ir-details > section + section { border-left: 0; border-top: 1px solid #e2e8f0; padding-left: 0; padding-top: 16px; }
    .ir-table th, .ir-table td { padding-left: 8px; padding-right: 8px; }
    .ir-table th:last-child, .ir-table td:last-child { width: 96px; }
    .ir-total { padding: 12px; gap: 12px; }
    .ir-total-value { font-size: 22px; }
    .ir-payment { grid-template-columns: minmax(0, 1fr); gap: 14px; }
    .ir-actions { flex-direction: column; align-items: stretch; gap: 12px; }
    .ir-action-buttons { display: grid; grid-template-columns: 1fr 1fr; }
  }
  @media print {
    @page { margin: 14mm; }
    html, body { height: auto !important; overflow: visible !important; background: #fff !important; }
    body * { visibility: hidden !important; }
    body > *:not(:has(#studyflow-invoice-print-area)):not(style):not(script) { display: none !important; }
    .modal-overlay:has(#studyflow-invoice-print-area),
    .modal-container:has(#studyflow-invoice-print-area),
    .modal-body:has(#studyflow-invoice-print-area),
    .ir-receipt {
      display: block !important; position: static !important; inset: auto !important; transform: none !important;
      width: 100% !important; max-width: none !important; min-height: 0 !important; height: auto !important; max-height: none !important;
      overflow: visible !important; padding: 0 !important; margin: 0 !important; border: 0 !important;
      border-radius: 0 !important; box-shadow: none !important; background: #fff !important;
      backdrop-filter: none !important; -webkit-backdrop-filter: none !important; animation: none !important; opacity: 1 !important;
    }
    .modal-container:has(#studyflow-invoice-print-area) > .modal-header,
    .modal-container:has(#studyflow-invoice-print-area) > .modal-footer,
    .ir-actions { display: none !important; }
    #studyflow-invoice-print-area, #studyflow-invoice-print-area * { visibility: visible !important; }
    #studyflow-invoice-print-area { position: static !important; width: 100% !important; padding: 0 !important; margin: 0 !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .ir-header, .ir-details, .ir-table tr, .ir-total, .ir-payment { break-inside: avoid; }
    .ir-table thead { display: table-header-group; }
  }
`;

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({
  isOpen,
  onClose,
  createdInvoiceData,
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const workspaceName = user?.workspace?.name || 'N/A';

  if (!createdInvoiceData) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Fee Receipt & Invoice" maxWidth="lg">
      <div className="ir-receipt">
        <style>{receiptStyles}</style>
        <article id="studyflow-invoice-print-area" className="ir-paper" aria-label="Fee receipt and invoice">
          <header className="ir-header">
            <div>
              <p className="ir-eyebrow">Fee receipt & invoice</p>
              <h2 className="ir-brand">{workspaceName}</h2>
              <p className="ir-subtitle">Library & Study Space Management</p>
              {createdInvoiceData.branchName && (
                <p className="ir-branch"><strong>Branch:</strong> {createdInvoiceData.branchName}</p>
              )}
            </div>
            <div className="ir-meta">
              <span className="ir-status" data-paid={createdInvoiceData.payment.status === 'PAID'}>
                {createdInvoiceData.payment.status}
              </span>
              <div className="ir-number">INV-{createdInvoiceData.payment.id.substring(0, 8).toUpperCase()}</div>
              <div className="ir-date">
                Date: {new Date(createdInvoiceData.payment.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </header>

          <div className="ir-details">
            <section aria-label="Student details">
              <h3 className="ir-section-title">Bill to</h3>
              <p className="ir-name">{createdInvoiceData.student?.user?.name || 'N/A'}</p>
              <div className="ir-detail-row"><span>Phone</span><span>{createdInvoiceData.student?.user?.mobile || 'N/A'}</span></div>
              <div className="ir-detail-row"><span>Email</span><span>{createdInvoiceData.student?.user?.email || 'No Email'}</span></div>
              <div className="ir-detail-row"><span>Reg ID</span><span>STD-{createdInvoiceData.student?.id?.slice(0, 4).toUpperCase() || 'XXXX'}</span></div>
            </section>
            <section aria-label="Booking details">
              <h3 className="ir-section-title">Booking details</h3>
              <p className="ir-name">Seat {createdInvoiceData.seatNumber || 'N/A'}</p>
              <div className="ir-detail-row">
                <span>Shift</span>
                <span>
                  {createdInvoiceData.shift?.name || 'N/A'} ({calculateShiftDuration(createdInvoiceData.shift?.startTime, createdInvoiceData.shift?.endTime)})
                  <span className="ir-shift-time">{formatTo12hString(createdInvoiceData.shift?.startTime) || ''} - {formatTo12hString(createdInvoiceData.shift?.endTime) || ''}</span>
                </span>
              </div>
              <div className="ir-detail-row">
                <span>Duration</span>
                <span>{new Date(createdInvoiceData.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - {new Date(createdInvoiceData.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </section>
          </div>

          <table className="ir-table" aria-label="Invoice charges">
            <thead><tr><th scope="col">Description</th><th scope="col">Amount</th></tr></thead>
            <tbody>
              <tr>
                <td>
                  <div className="ir-item-title">Seat Booking Subscription Fee</div>
                  <div className="ir-item-note">Seat {createdInvoiceData.seatNumber} | {createdInvoiceData.shift?.name} Shift ({createdInvoiceData.startDate} to {createdInvoiceData.endDate})</div>
                </td>
                <td className="ir-amount">₹{(createdInvoiceData.originalAmount ?? createdInvoiceData.payment.amount).toFixed(2)}</td>
              </tr>
              {createdInvoiceData.originalAmount !== undefined &&
                createdInvoiceData.payableAmount !== undefined &&
                createdInvoiceData.originalAmount !== createdInvoiceData.payableAmount && (
                  <tr className="ir-adjustment">
                    <td>Adjustment / Discount</td>
                    <td className="ir-amount" style={{ color: createdInvoiceData.payableAmount < createdInvoiceData.originalAmount ? '#15803d' : '#b91c1c' }}>
                      {createdInvoiceData.payableAmount < createdInvoiceData.originalAmount ? '-' : '+'}₹{Math.abs(createdInvoiceData.originalAmount - createdInvoiceData.payableAmount).toFixed(2)}
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
          <div className="ir-total">
            <span className="ir-total-label">Total Payable Amount</span>
            <strong className="ir-total-value">₹{(createdInvoiceData.payableAmount ?? createdInvoiceData.payment.amount).toFixed(2)}</strong>
          </div>

          <div className="ir-payment">
            <div>
              <p className="ir-payment-label">Payment method</p>
              <p className="ir-payment-value">{createdInvoiceData.payment.method}</p>
            </div>
            {createdInvoiceData.payment.transactionId && (
              <div>
                <p className="ir-payment-label">Transaction ID</p>
                <p className="ir-payment-value">{createdInvoiceData.payment.transactionId}</p>
              </div>
            )}
          </div>
          <p className="ir-thanks">Thank you for booking with {workspaceName}!</p>
        </article>
        <div className="ir-actions">
          <p className="ir-actions-note">Print a copy or save as PDF from the print dialog.</p>
          <div className="ir-action-buttons">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button variant="primary" onClick={() => { window.print(); }}>Print Invoice</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
