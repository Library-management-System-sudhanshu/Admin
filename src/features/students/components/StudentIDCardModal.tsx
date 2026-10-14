import React from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Card } from '../../../components/ui/Card';
import {
  getStudentDisplayName,
  getStudentInitials,
  getStudentEmail,
  getStudentMobile,
  getStudentBranchName,
} from '../../../utils/studentUtils';

interface StudentIDCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
  workspaceName?: string;
  branches?: Array<{ id: string; name: string }>;
}

export const StudentIDCardModal: React.FC<StudentIDCardModalProps> = ({
  isOpen,
  onClose,
  student,
  workspaceName = 'N/A',
  branches,
}) => {
  if (!student) return null;

  const displayName = getStudentDisplayName(student);
  const initials = getStudentInitials(student);
  const email = getStudentEmail(student);
  const mobile = getStudentMobile(student);
  const branchName = getStudentBranchName(student, branches);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Student ID Card"
      maxWidth="sm"
    >
      <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
        <Card
          style={{
            width: '320px',
            border: '2px solid var(--primary)',
            borderRadius: '1rem',
            overflow: 'hidden',
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
            backgroundColor: '#ffffff',
            color: '#0f172a',
          }}
        >
          {/* Card Header */}
          <div
            style={{
              backgroundColor: 'var(--primary)',
              padding: '1rem',
              textAlign: 'center',
              color: '#ffffff',
            }}
          >
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.125rem' }}>
              {workspaceName.toUpperCase()}
            </h3>
            <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>Digital Student Badge</span>
          </div>

          {/* Card Body */}
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                fontWeight: 600,
                marginBottom: '1rem',
                background: (student.user?.avatar || student.avatar)
                  ? `url(${student.user?.avatar || student.avatar}) no-repeat center center / cover`
                  : 'var(--primary)',
              }}
            >
              {!(student.user?.avatar || student.avatar) && initials}
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.25rem 0', textAlign: 'center' }}>
              {displayName}
            </h2>
            <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.875rem' }}>
              ID: SF-{student.id ? student.id.substring(0, 8).toUpperCase() : 'N/A'}
            </p>

            {/* Details list */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                marginBottom: '1.5rem',
                borderTop: '1px solid #f1f5f9',
                borderBottom: '1px solid #f1f5f9',
                padding: '1rem 0',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ color: '#64748b', fontWeight: 500 }}>Mobile</span>
                <span style={{ color: '#0f172a', fontWeight: 600 }}>{mobile}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ color: '#64748b', fontWeight: 500 }}>Email</span>
                <span
                  style={{
                    color: '#0f172a',
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '170px',
                  }}
                  title={email}
                >
                  {email}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ color: '#64748b', fontWeight: 500 }}>Branch</span>
                <span style={{ color: '#0f172a', fontWeight: 600 }}>{branchName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ color: '#64748b', fontWeight: 500 }}>Admission</span>
                <span style={{ color: '#0f172a', fontWeight: 600 }}>
                  {student.joiningDate ? new Date(student.joiningDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            {/* QR Code */}
            {student.qrCodeUrl && (
              <img
                src={student.qrCodeUrl}
                alt="QR Code"
                style={{ width: 120, height: 120, border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}
              />
            )}
          </div>
        </Card>
      </div>
    </Modal>
  );
};
