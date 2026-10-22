import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useToast } from '../../../components/ui/ToastContext';
import { useUpdateStudentMutation } from '../../../store/api';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  CreditCard, 
  MapPin, 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  Building2, 
  Hash,
  Eye,
  EyeOff
} from 'lucide-react';

interface BranchOption {
  id: string;
  name: string;
}

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
  branches: BranchOption[];
  workspaceName?: string;
  onSuccess?: () => void;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  isOpen,
  onClose,
  student,
  branches = [],
  workspaceName,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [updateStudent, { isLoading }] = useUpdateStudentMutation();

  // Active tab inside modal
  const [activeTab, setActiveTab] = useState<'profile' | 'guardian' | 'enrollment' | 'security'>('profile');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER' | ''>('');
  const [avatar, setAvatar] = useState('');
  const [joiningDate, setJoiningDate] = useState('');

  const [guardianName, setGuardianName] = useState('');
  const [guardianMobile, setGuardianMobile] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');
  const [address, setAddress] = useState('');

  const [status, setStatus] = useState<string>('APPROVED');
  const [branchId, setBranchId] = useState<string>('');
  const [dueAmount, setDueAmount] = useState<string>('0');

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  // Initialize form state when student changes
  useEffect(() => {
    if (student && isOpen) {
      setName(student.displayName || student.user?.name || student.name || '');
      setEmail(student.contactEmail || student.user?.email || student.email || '');
      setMobile(student.contactMobile || student.user?.mobile || student.mobile || '');
      setGender(student.gender || '');
      setAvatar(student.avatar || student.user?.avatar || '');
      
      if (student.joiningDate) {
        try {
          const dateObj = new Date(student.joiningDate);
          setJoiningDate(dateObj.toISOString().split('T')[0]);
        } catch {
          setJoiningDate('');
        }
      } else {
        setJoiningDate('');
      }

      setGuardianName(student.guardianName || '');
      setGuardianMobile(student.guardianMobile || '');
      setAadharNumber(student.aadharNumber || '');
      setAddress(student.address || '');

      setStatus(student.status || 'APPROVED');
      setBranchId(student.branchId || student.branch?.id || '');
      setDueAmount(student.dueAmount !== undefined ? String(student.dueAmount) : '0');

      setPassword('');
      setShowPassword(false);
      setErrors({});
      setServerError(null);
      setActiveTab('profile');
    }
  }, [student, isOpen]);

  // Validation function
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 1. Name validation
    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Full name must be at least 2 characters';
    } else if (name.trim().length > 100) {
      newErrors.name = 'Full name cannot exceed 100 characters';
    }

    // 2. Email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailPattern.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // 3. Mobile validation
    const phonePattern = /^\+?[0-9\s\-]{7,15}$/;
    if (!mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!phonePattern.test(mobile.trim())) {
      newErrors.mobile = 'Mobile number must be 7 to 15 digits';
    }

    // 4. Guardian Mobile validation
    if (guardianMobile.trim() && !phonePattern.test(guardianMobile.trim())) {
      newErrors.guardianMobile = 'Guardian mobile must be 7 to 15 digits';
    }

    // 5. Guardian Name validation
    if (guardianName.trim() && guardianName.trim().length > 100) {
      newErrors.guardianName = 'Guardian name cannot exceed 100 characters';
    }

    // 6. Aadhar validation
    if (aadharNumber.trim()) {
      const cleanAadhar = aadharNumber.replace(/\s+/g, '');
      if (!/^\d{12}$/.test(cleanAadhar)) {
        newErrors.aadharNumber = 'Aadhar number must be exactly 12 digits';
      }
    }

    // 7. Due Amount validation
    if (dueAmount.trim() !== '') {
      const parsedDue = Number(dueAmount);
      if (isNaN(parsedDue) || parsedDue < 0) {
        newErrors.dueAmount = 'Due amount must be a valid number ≥ 0';
      }
    }

    // 8. Password validation (optional)
    if (password.trim() && password.trim().length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    // 9. Address validation
    if (address.trim() && address.trim().length > 500) {
      newErrors.address = 'Address cannot exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setServerError(null);

    if (!validate()) {
      showToast('Please fix the validation errors in the form', 'error');
      return;
    }

    if (!student?.id) {
      showToast('Student ID not found', 'error');
      return;
    }

    try {
      const payload: any = {
        id: student.id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        mobile: mobile.trim(),
        gender: gender || null,
        avatar: avatar.trim() || null,
        guardianName: guardianName.trim() || null,
        guardianMobile: guardianMobile.trim() || null,
        aadharNumber: aadharNumber.trim() ? aadharNumber.replace(/\s+/g, '') : null,
        address: address.trim() || null,
        status,
        branchId: branchId || null,
        dueAmount: dueAmount.trim() !== '' ? Math.max(0, Number(dueAmount)) : 0,
      };

      if (joiningDate) {
        payload.joiningDate = new Date(joiningDate).toISOString();
      }

      if (password.trim()) {
        payload.password = password.trim();
      }

      const res = await updateStudent(payload).unwrap();
      showToast('Student details updated successfully with all validations!', 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Failed to update student details';
      setServerError(msg);
      showToast(msg, 'error');
    }
  };

  const branchOptions = [
    { value: '', label: 'Unassigned / Main Workspace' },
    ...branches.map((b) => ({ value: b.id, label: b.name })),
  ];

  const statusOptions = [
    { value: 'APPROVED', label: 'APPROVED (Active)' },
    { value: 'PENDING', label: 'PENDING (Awaiting Review)' },
    { value: 'WAITLISTED', label: 'WAITLISTED' },
    { value: 'REJECTED', label: 'REJECTED' },
  ];

  const genderOptions = [
    { value: '', label: 'Select Gender' },
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER', label: 'Other' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            fontSize: '0.95rem',
            boxShadow: '0 2px 6px rgba(59, 130, 246, 0.25)'
          }}>
            {(name || student?.displayName || 'S').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ 
              fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
              fontSize: '1.15rem', 
              fontWeight: 600, 
              color: '#0f172a',
              letterSpacing: '-0.02em'
            }}>
              Edit Student Details (Super Admin)
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 400 }}>
              Student ID: <code style={{ color: '#2563eb', fontWeight: 500 }}>{student?.id}</code>
              {workspaceName && ` • Workspace: ${workspaceName}`}
            </div>
          </div>
        </div>
      }
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            * Required fields must pass strict validation
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => handleSubmit()} disabled={isLoading}>
              {isLoading ? 'Saving Changes...' : 'Save & Update Details'}
            </Button>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Server error alert */}
        {serverError && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '10px',
            color: '#b91c1c',
            fontSize: '0.875rem'
          }}>
            <AlertCircle size={18} />
            <span>{serverError}</span>
          </div>
        )}

        {/* Tab navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          gap: '8px'
        }}>
          {[
            { id: 'profile', label: 'Personal Info', icon: <User size={15} /> },
            { id: 'guardian', label: 'Guardian & Address', icon: <MapPin size={15} /> },
            { id: 'enrollment', label: 'Enrollment & Dues', icon: <Building2 size={15} /> },
            { id: 'security', label: 'Security & Access', icon: <Shield size={15} /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  border: 'none',
                  background: 'none',
                  borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
                  color: isActive ? '#2563eb' : '#64748b',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: PERSONAL INFO */}
        {activeTab === 'profile' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <Input
                label="Full Name *"
                placeholder="Enter full name"
                value={name}
                error={errors.name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                }}
              />
            </div>

            <div>
              <Input
                label="Contact Email *"
                type="email"
                placeholder="student@example.com"
                value={email}
                error={errors.email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                }}
                helperText="Primary email used for account authentication and notifications"
              />
            </div>

            <div>
              <Input
                label="Mobile Number *"
                placeholder="e.g. 9876543210"
                value={mobile}
                error={errors.mobile}
                onChange={(e) => {
                  setMobile(e.target.value);
                  if (errors.mobile) setErrors(prev => ({ ...prev, mobile: '' }));
                }}
                helperText="10 to 15 digits"
              />
            </div>

            <div>
              <Select
                label="Gender"
                value={gender}
                options={genderOptions}
                onChange={(val) => setGender(val)}
              />
            </div>

            <div>
              <Input
                label="Joining Date"
                type="date"
                value={joiningDate}
                error={errors.joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
              />
            </div>

            <div>
              <Input
                label="Avatar URL (Optional)"
                placeholder="https://example.com/avatar.jpg"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                helperText="Direct image URL for student profile picture"
              />
            </div>
          </div>
        )}

        {/* TAB 2: GUARDIAN & ADDRESS */}
        {activeTab === 'guardian' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <Input
                label="Guardian / Parent Name"
                placeholder="Enter guardian full name"
                value={guardianName}
                error={errors.guardianName}
                onChange={(e) => {
                  setGuardianName(e.target.value);
                  if (errors.guardianName) setErrors(prev => ({ ...prev, guardianName: '' }));
                }}
              />
            </div>

            <div>
              <Input
                label="Guardian Contact Number"
                placeholder="e.g. 9876543211"
                value={guardianMobile}
                error={errors.guardianMobile}
                onChange={(e) => {
                  setGuardianMobile(e.target.value);
                  if (errors.guardianMobile) setErrors(prev => ({ ...prev, guardianMobile: '' }));
                }}
                helperText="Emergency contact number"
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <Input
                label="Aadhar Number (12 Digits)"
                placeholder="XXXX XXXX XXXX"
                value={aadharNumber}
                error={errors.aadharNumber}
                onChange={(e) => {
                  setAadharNumber(e.target.value);
                  if (errors.aadharNumber) setErrors(prev => ({ ...prev, aadharNumber: '' }));
                }}
                helperText="Government identification number for library admission records"
              />
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#334155' }}>
                Residential Address
              </label>
              <textarea
                rows={3}
                placeholder="Enter full permanent/temporary address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: errors.address ? '1px solid #ef4444' : '1px solid #cbd5e1',
                  fontSize: '0.875rem',
                  color: '#1e293b',
                  fontFamily: 'inherit',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
              {errors.address && (
                <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{errors.address}</span>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ENROLLMENT & DUES */}
        {activeTab === 'enrollment' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <Select
                label="Enrollment Status *"
                value={status}
                options={statusOptions}
                onChange={(val) => setStatus(val)}
              />
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                Controls student active access to facilities and app login
              </p>
            </div>

            <div>
              <Select
                label="Branch Assignment"
                value={branchId}
                options={branchOptions}
                onChange={(val) => setBranchId(val)}
              />
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                Specific library branch within {workspaceName || 'this workspace'}
              </p>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <Input
                label="Due Balance (₹)"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={dueAmount}
                error={errors.dueAmount}
                onChange={(e) => {
                  setDueAmount(e.target.value);
                  if (errors.dueAmount) setErrors(prev => ({ ...prev, dueAmount: '' }));
                }}
                helperText="Outstanding balance due from this student. Set to 0 if fully paid."
              />
            </div>

            {/* Current Active Allocations / Subscriptions info summary */}
            {student?.allocations && student.allocations.length > 0 && (
              <div style={{
                gridColumn: 'span 2',
                padding: '12px 16px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.85rem'
              }}>
                <div style={{ fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Current Seat Allocations ({student.allocations.length})
                </div>
                {student.allocations.map((alloc: any, idx: number) => (
                  <div key={alloc.id || idx} style={{ color: '#64748b', fontSize: '0.8rem' }}>
                    • Seat: <strong>{alloc.seat?.seatNumber || alloc.seat?.number || 'Seat assigned'}</strong> 
                    {alloc.shift?.name && ` | Shift: ${alloc.shift.name}`}
                    {alloc.isActive ? ' (Active)' : ' (Inactive)'}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SECURITY & ACCESS */}
        {activeTab === 'security' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              padding: '14px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '10px',
              color: '#1e40af',
              fontSize: '0.85rem'
            }}>
              <div style={{ fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Shield size={16} /> Super Admin Privilege: Password Reset
              </div>
              <div>
                As a Super Admin, you can securely override and reset the student's authentication password.
                Leave this field blank if you do not want to change their existing password.
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <Input
                label="Set New Password (Optional)"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new student password (min 6 characters)"
                value={password}
                error={errors.password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                }}
                helperText="Must be at least 6 characters. If left empty, student keeps their current password."
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '32px',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px'
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        )}

      </div>
    </Modal>
  );
};
