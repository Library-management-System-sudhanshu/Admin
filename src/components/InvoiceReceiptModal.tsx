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

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({
  isOpen,
  onClose,
  createdInvoiceData,
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const workspaceName = user?.workspace?.name || 'N/A';

  if (!createdInvoiceData) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Fee Receipt & Invoice"
      maxWidth="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * { visibility: hidden !important; }
            #studyflow-invoice-print-area,
            #studyflow-invoice-print-area * { visibility: visible !important; }
            #studyflow-invoice-print-area {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              border: none !important;
              padding: 0 !important;
              margin: 0 !important;
              box-shadow: none !important;
              background: white !important;
            }
          }
        `}} />
        
        <div 
          id="studyflow-invoice-print-area"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-card)',
            borderRadius: '12px',
            padding: '24px',
            color: '#1e293b',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #f1f5f9', paddingBottom: '16px', marginBottom: '16px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-blue)', letterSpacing: '-0.025em' }}>{workspaceName}</h2>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Library & Study Space Management</span>
              {createdInvoiceData.branchName && (
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                  <strong>Branch:</strong> {createdInvoiceData.branchName}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ 
                display: 'inline-block', 
                fontSize: '0.7rem', 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                backgroundColor: createdInvoiceData.payment.status === 'PAID' ? '#dcfce7' : '#fee2e2',
                color: createdInvoiceData.payment.status === 'PAID' ? '#15803d' : '#b91c1c',
                padding: '2px 8px',
                borderRadius: '12px',
                marginBottom: '8px'
              }}>
                {createdInvoiceData.payment.status}
              </span>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                INV-{createdInvoiceData.payment.id.substring(0, 8).toUpperCase()}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                Date: {new Date(createdInvoiceData.payment.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bill To</h4>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                {createdInvoiceData.student?.user?.name || 'N/A'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px' }}>
                <strong>Phone:</strong> {createdInvoiceData.student?.user?.mobile || 'N/A'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '2px' }}>
                <strong>Email:</strong> {createdInvoiceData.student?.user?.email || 'No Email'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '2px' }}>
                <strong>Reg ID:</strong> STD-{createdInvoiceData.student?.id?.slice(0, 4).toUpperCase() || 'XXXX'}
              </div>
            </div>
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Booking Details</h4>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                Seat {createdInvoiceData.seatNumber || 'N/A'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px' }}>
                <strong>Shift:</strong> {createdInvoiceData.shift?.name || 'N/A'} ({calculateShiftDuration(createdInvoiceData.shift?.startTime, createdInvoiceData.shift?.endTime)}) ({formatTo12hString(createdInvoiceData.shift?.startTime) || ''} - {formatTo12hString(createdInvoiceData.shift?.endTime) || ''})
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '2px' }}>
                <strong>Duration:</strong> {new Date(createdInvoiceData.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - {new Date(createdInvoiceData.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '8px 0', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Description</th>
                <th style={{ padding: '8px 0', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 0', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>Seat Booking Subscription Fee</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                    Seat {createdInvoiceData.seatNumber} | {createdInvoiceData.shift?.name} Shift ({createdInvoiceData.startDate} to {createdInvoiceData.endDate})
                  </div>
                </td>
                <td style={{ padding: '12px 0', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>
                  ₹{(createdInvoiceData.originalAmount ?? createdInvoiceData.payment.amount).toFixed(2)}
                </td>
              </tr>
              
              {createdInvoiceData.originalAmount !== undefined && 
               createdInvoiceData.payableAmount !== undefined && 
               createdInvoiceData.originalAmount !== createdInvoiceData.payableAmount && (
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 0', fontSize: '0.85rem', color: '#475569' }}>
                    Adjustment / Discount
                  </td>
                  <td style={{ padding: '8px 0', fontSize: '0.85rem', fontWeight: 600, color: createdInvoiceData.payableAmount < createdInvoiceData.originalAmount ? '#15803d' : '#b91c1c', textAlign: 'right' }}>
                    {createdInvoiceData.payableAmount < createdInvoiceData.originalAmount ? '-' : '+'}₹{Math.abs(createdInvoiceData.originalAmount - createdInvoiceData.payableAmount).toFixed(2)}
                  </td>
                </tr>
              )}

              <tr>
                <td style={{ padding: '12px 0 0 0', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Total Payable Amount</td>
                <td style={{ padding: '12px 0 0 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-blue)', textAlign: 'right' }}>
                  ₹{(createdInvoiceData.payableAmount ?? createdInvoiceData.payment.amount).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                <strong>Payment Method:</strong> {createdInvoiceData.payment.method}
              </div>
              {createdInvoiceData.payment.transactionId && (
                <div style={{ fontSize: '0.675rem', color: '#64748b', marginTop: '2px' }}>
                  <strong>Txn ID:</strong> {createdInvoiceData.payment.transactionId}
                </div>
              )}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
              Thank you for booking with {workspaceName}!
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
          <Button
            variant="outline"
            onClick={onClose}
            style={{ borderRadius: '12px' }}
          >
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              window.print();
            }}
            style={{
              backgroundColor: 'var(--accent-blue)',
              borderColor: 'var(--accent-blue)',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
            }}
          >
            Print Invoice
          </Button>
        </div>
      </div>
    </Modal>
  );
};
