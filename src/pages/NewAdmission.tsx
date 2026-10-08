import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import {
  useCreateStudentMutation,
  useGetBranchesQuery,
  useGetShiftsQuery,
  useUploadImageMutation,
} from '../store/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useToast } from '../components/ui/ToastContext';
import { CustomCalendar } from '../components/ui/CustomCalendar';
import { UserPlus, MapPin, Layers, Camera, Calendar as CalendarIcon } from 'lucide-react';
import { getTodayYYYYMMDD } from '../utils/dateUtils';
import '../components/ui/Globals.css';
const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
  });
};
export default function NewAdmission() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useSelector((state: RootState) => state.auth);
  // Success Modal & Newly Created Student Profile Info
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [createdStudent, setCreatedStudent] = useState<{ id: string; name: string; joiningDate?: string; shiftId?: string } | null>(null);
  const handleResetForm = () => {
    setName('');
    setEmail('');
    setMobile('');
    setPassword('Student@123');
    setGender('MALE');
    setAddress('');
    setGuardianName('');
    setGuardianMobile('');
    setAadharNumber('');
    setShiftId('');
    setAmountPaid('');
    setAvatar('');
    setErrors({});
    setIsSuccessModalOpen(false);
    setCreatedStudent(null);
  };
  // Queries & Mutations
  const { data: branches } = useGetBranchesQuery(
    user?.workspaceId,
    { skip: !user?.workspaceId }
  );
  const { data: shifts, isLoading: isLoadingShifts, error: shiftsError } = useGetShiftsQuery(
    user?.workspaceId,
    { skip: !user?.workspaceId }
  );
  const [createStudent, { isLoading: isSubmitting }] = useCreateStudentMutation();
  const [uploadImage, { isLoading: isUploadingImage }] = useUploadImageMutation();
  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('Student@123');
  const [gender, setGender] = useState('MALE');
  const [address, setAddress] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianMobile, setGuardianMobile] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');
  const [branchId, setBranchId] = useState('');
  const [shiftId, setShiftId] = useState('');
  const [selectedDurationLabel, setSelectedDurationLabel] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [avatar, setAvatar] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [joiningDate, setJoiningDate] = useState(() => getTodayYYYYMMDD());
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [openDirection, setOpenDirection] = useState<'bottom' | 'top'>('bottom');
  const dateContainerRef = useRef<HTMLDivElement>(null);
  const toggleCalendarPicker = () => {
    if (!showCalendarPicker && dateContainerRef.current) {
      const rect = dateContainerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      if (spaceBelow < 340 && spaceAbove > spaceBelow) {
        setOpenDirection('top');
      } else {
        setOpenDirection('bottom');
      }
    }
    setShowCalendarPicker(!showCalendarPicker);
  };
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateContainerRef.current && !dateContainerRef.current.contains(event.target as Node)) {
        setShowCalendarPicker(false);
      }
    };
    if (showCalendarPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendarPicker]);
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const rawBase64 = reader.result as string;
      try {
        const compressedBase64 = await compressImage(rawBase64);
        const uploadResult = await uploadImage({ base64: compressedBase64 }).unwrap();
        setAvatar(uploadResult.url);
        showToast('Photo uploaded successfully!', 'success');
      } catch (err: any) {
        showToast(err?.data?.message || 'Failed to upload photo.', 'error');
      }
    };
    reader.readAsDataURL(file);
  };
  const selectedShiftPrice = useMemo(() => {
    if (!shiftId || !shifts) return 0;
    const shift = shifts.find((s: any) => s.id === shiftId);
    if (!shift) return 0;
    if (selectedDurationLabel && shift.customPricing && Array.isArray(shift.customPricing)) {
      const cp = shift.customPricing.find((c: any) => c.label === selectedDurationLabel);
      if (cp) return cp.price;
    }
    return shift.price;
  }, [shiftId, shifts, selectedDurationLabel]);
  const dueAmount = useMemo(() => {
    const paid = parseFloat(amountPaid) || 0;
    const discount = parseFloat(discountAmount) || 0;
    return Math.max(0, selectedShiftPrice - paid - discount);
  }, [selectedShiftPrice, amountPaid, discountAmount]);
  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Auto-set first branch if available
  useEffect(() => {
    if (branches && branches.length > 0 && !branchId) {
      setBranchId(branches[0].id);
    }
  }, [branches, branchId]);
  const validateField = (field: string, value: string) => {
    let errorMsg = '';
    switch (field) {
      case 'name':
        if (!/^[a-zA-Z0-9\s\.\-]*$/.test(value)) {
          errorMsg = 'Name can contain only letters, numbers, spaces, dots, and hyphens';
        } else if (value.trim().length > 0 && value.trim().length < 2) {
          errorMsg = 'Name must be at least 2 characters';
        } else if (value.trim().length > 50) {
          errorMsg = 'Name must be at most 50 characters';
        }
        break;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value.trim().length > 0 && !emailRegex.test(value.trim())) {
          errorMsg = 'Invalid email address';
        }
        break;
      case 'mobile':
        if (value.trim().length > 0 && !/^\d*$/.test(value.trim())) {
          errorMsg = 'Mobile number must contain only digits';
        } else if (value.trim().length > 0 && value.trim().length !== 10) {
          errorMsg = 'Mobile number must be exactly 10 digits';
        }
        break;
      case 'password':
        if (value.length > 0 && value.length < 6) {
          errorMsg = 'Password must be at least 6 characters';
        }
        break;
      case 'guardianName':
        if (!/^[a-zA-Z0-9\s\.\-]*$/.test(value)) {
          errorMsg = 'Guardian name can contain only letters, numbers, spaces, dots, and hyphens';
        } else if (value.trim().length > 0 && value.trim().length < 2) {
          errorMsg = 'Guardian name must be at least 2 characters';
        }
        break;
      case 'guardianMobile':
        if (value.trim().length > 0 && !/^\d*$/.test(value.trim())) {
          errorMsg = 'Guardian mobile must contain only digits';
        } else if (value.trim().length > 0 && value.trim().length !== 10) {
          errorMsg = 'Guardian mobile must be exactly 10 digits';
        }
        break;
      case 'aadharNumber':
        if (value.trim().length > 0 && !/^\d*$/.test(value.trim())) {
          errorMsg = 'Aadhar card must contain only digits';
        } else if (value.trim().length > 0 && value.trim().length !== 12) {
          errorMsg = 'Aadhar card must be exactly 12 digits';
        }
        break;
      default:
        break;
    }
    setErrors(prev => ({ ...prev, [field]: errorMsg }));
  };
  const handleChange = (field: string, value: string, setter: (val: string) => void) => {
    const finalVal = field === 'email' ? value.toLowerCase() : value;
    setter(finalVal);
    validateField(field, finalVal);
  };
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Student name is required';
    if (!mobile.trim()) newErrors.mobile = 'Mobile number is required';
    if (!branchId) newErrors.branchId = 'Target branch is required';
    if (name.trim() && !/^[a-zA-Z0-9\s\.\-]{2,50}$/.test(name.trim())) {
      newErrors.name = 'Name must be 2-50 characters';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.trim() && !emailRegex.test(email.trim())) {
      newErrors.email = 'Invalid email address';
    }
    if (mobile.trim() && !/^\d{10}$/.test(mobile.trim())) {
      newErrors.mobile = 'Mobile number must be exactly 10 digits';
    }
    if (password && password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (guardianName.trim() && !/^[a-zA-Z0-9\s\.\-]{2,50}$/.test(guardianName.trim())) {
      newErrors.guardianName = 'Guardian name must be 2-50 characters';
    }
    if (guardianMobile.trim() && !/^\d{10}$/.test(guardianMobile.trim())) {
      newErrors.guardianMobile = 'Guardian mobile must be exactly 10 digits';
    }
    if (aadharNumber.trim() && !/^\d{12}$/.test(aadharNumber.trim())) {
      newErrors.aadharNumber = 'Aadhar number must be exactly 12 digits';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('Please fix the errors before submitting', 'error');
      return;
    }
    try {
      const getDurationDays = (label: string) => {
        const l = label.toLowerCase();
        const num = parseInt(l) || 1;
        if (l.includes('day')) return num;
        if (l.includes('month')) return num * 30;
        if (l.includes('year')) return num * 365;
        return 30;
      };
      const result = await createStudent({
        name,
        email,
        mobile,
        password,
        gender,
        address,
        joiningDate,
        guardianName: guardianName || undefined,
        guardianMobile: guardianMobile || undefined,
        aadharNumber: aadharNumber || undefined,
        branchId,
        shiftId: shiftId || undefined,
        durationDays: selectedDurationLabel ? getDurationDays(selectedDurationLabel) : 30,
        shiftPrice: selectedShiftPrice,
        amountPaid: amountPaid === '' ? 0 : Number(amountPaid),
        discountAmount: discountAmount || undefined,
        workspaceId: user?.workspaceId,
        avatar: avatar || undefined,
      }).unwrap();
      showToast('Student admitted successfully!', 'success');
      const studentId = result?.profile?.id || result?.student?.id || result?.id || result?.data?.id;
      setCreatedStudent({
        id: studentId || 'new-student',
        name: name,
        joiningDate: joiningDate,
        shiftId: shiftId,
      });
      setIsSuccessModalOpen(true);
    } catch (err: any) {
      showToast(err?.data?.message || 'Failed to complete admission', 'error');
    }
  };
  const genderOptions = [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER', label: 'Other' },
  ];
  const shiftOptions = useMemo(() => {
    if (isLoadingShifts) {
      return [{ value: '', label: 'Loading seating shifts...' }];
    }
    if (shiftsError) {
      return [{ value: '', label: 'Error loading shifts' }];
    }
    const baseOptions = !shifts || shifts.length === 0
      ? [{ value: '', label: 'No Shift (Admission only)' }]
      : [
          { value: '', label: 'No Shift (Admission only)' },
          ...shifts.map((s: any) => ({
            value: s.id,
            label: s.name,
          })),
        ];
    return [
      ...baseOptions,
      { value: 'ADD_NEW_SHIFT', label: '+ Add New Shift', isAction: true },
    ];
  }, [shifts, isLoadingShifts, shiftsError]);
  return (
    <div className="new-admission animate-fade-in">
      <style>{`
        .new-admission { --na-blue: #2563eb; --na-border: #e2e8f0; width: 100%; max-width: 1280px; margin: 0 auto; padding-bottom: 24px; color: #0f172a; }
        .new-admission *, .new-admission *::before, .new-admission *::after { box-sizing: border-box; }
        .new-admission .na-intro { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 16px; }
        .new-admission .na-intro p { margin: 0; font-size: 13px; color: #64748b; line-height: 1.5; }
        .new-admission .na-required { flex-shrink: 0; padding: 6px 10px; background: #eff6ff; border: 1px solid #dbeafe; border-radius: 7px; font-size: 11px; color: #1d4ed8; font-weight: 600; }
        .new-admission .na-layout { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(320px, 1fr); gap: 18px; align-items: start; }
        .new-admission .na-personal { grid-column: 1; grid-row: 1 / 3; }
        .new-admission .na-subscription { grid-column: 2; grid-row: 1; }
        .new-admission .na-contact { grid-column: 2; grid-row: 2; }
        .new-admission .na-card { padding: 20px !important; background: #fff !important; border: 1px solid var(--na-border) !important; border-radius: 16px !important; overflow: visible !important; box-shadow: 0 2px 8px rgba(15,23,42,.025) !important; min-width: 0; }
        .new-admission .na-section-heading { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid #edf1f7; }
        .new-admission .na-section-heading > svg { box-sizing: content-box; padding: 8px; color: var(--na-blue) !important; background: #eff6ff; border-radius: 10px; flex-shrink: 0; }
        .new-admission .na-section-heading h3 { margin: 0; font-size: 14px; font-weight: 700; color: #0f172a; }
        .new-admission .na-avatar-row { display: flex; flex-direction: column; gap: 18px; align-items: stretch; }
        .new-admission .na-photo-block { display: flex; flex-direction: row; gap: 14px; align-items: center; padding: 12px 14px; border: 1px solid #e8eef7; border-radius: 12px; background: #f8faff; }
        .new-admission .na-photo-copy { display: flex; flex-direction: column; gap: 4px; }
        .new-admission .na-photo-copy strong { font-size: 13px; font-weight: 600; }
        .new-admission .na-photo-copy span { font-size: 12px; color: #64748b; }
        .new-admission .na-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px 14px; min-width: 0; width: 100%; }
        .new-admission .na-fields > * { min-width: 0; margin-bottom: 0 !important; }
        .new-admission .na-fields .custom-input-label { display: block; margin: 0 0 6px !important; font-size: 12px !important; line-height: 1.4; font-weight: 600; color: #475569; }
        .new-admission .na-fields input:not([type="checkbox"]):not([type="file"]) { min-height: 42px; font-size: 13px; border-radius: 9px; }
        .new-admission .na-fields input::placeholder { color: #94a3b8; }
        .new-admission .na-fields input:focus-visible { outline: 2px solid #93c5fd; outline-offset: 2px; }
        .new-admission .na-date-trigger { width: 100%; display: flex; align-items: center; justify-content: space-between; height: 42px; padding: 0 12px; border: 1px solid var(--na-border); border-radius: 9px; background: white; cursor: pointer; font-family: inherit; }
        .new-admission .na-date-trigger:focus-visible { outline: 2px solid #93c5fd; outline-offset: 2px; }
        .new-admission .na-date-trigger[aria-expanded="true"] { border-color: var(--na-blue); box-shadow: 0 0 0 3px #dbeafe; }
        .new-admission .na-due-panel { grid-column: 1 / -1; padding: 12px 14px; border: 1px solid #e2e8f0; border-radius: 10px; background: #f8fafc; }
        .new-admission .na-submit-row { grid-column: 1 / -1; display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-top: 0; padding: 14px 18px; background: #fff; border: 1px solid var(--na-border); border-radius: 12px; box-shadow: 0 2px 8px rgba(15,23,42,.025); }
        .new-admission .na-footer-copy { margin: 0; font-size: 12px; color: #64748b; line-height: 1.5; }
        .new-admission .na-actions { display: flex; align-items: center; gap: 10px; }
        .new-admission .na-actions button { min-height: 42px; font-size: 13px; }
        @media (min-width: 1200px) { .new-admission .na-personal .na-fields { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (max-width: 980px) {
          .new-admission .na-layout { grid-template-columns: minmax(0, 1fr); gap: 14px; }
          .new-admission .na-personal, .new-admission .na-subscription, .new-admission .na-contact { grid-column: auto; grid-row: auto; }
        }
        @media (max-width: 560px) {
          .new-admission .na-card { padding: 16px !important; border-radius: 12px !important; }
          .new-admission .na-fields { grid-template-columns: minmax(0, 1fr); gap: 14px; }
          .new-admission .na-intro { align-items: flex-start; }
          .new-admission .na-intro p { max-width: 220px; font-size: 12px; }
          .new-admission .na-submit-row { flex-direction: column; align-items: stretch; padding: 14px; gap: 12px; }
          .new-admission .na-actions { display: grid; grid-template-columns: 1fr 1fr; }
          .new-admission .na-actions > button { min-width: 0 !important; width: 100%; }
        }
      `}</style>
      <div className="na-intro">
        <p>Enter student details, choose a branch, and set up their subscription.</p>
        <span className="na-required">* Required fields</span>
      </div>
      <form onSubmit={handleSubmit} className="na-layout">
        {/* SECTION 1: PERSONAL DETAILS */}
        <section className="na-card na-personal">
       <Card elevation="sm" style={{ padding: 0, background: 'transparent', border: 'none', boxShadow: 'none', overflow: 'visible' }}>
          <div className="na-section-heading">
            <UserPlus size={16} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
            <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-navy)' }}>
              Personal Details
            </h3>
          </div>
          <div className="na-avatar-row">
            {/* Avatar */}
            <div className="na-photo-block">
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: avatar ? `url(${avatar}) no-repeat center center / cover` : 'linear-gradient(135deg, var(--accent-blue) 0%, #3b82f6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '1.4rem',
                    border: '2px solid #ffffff',
                    boxShadow: 'var(--shadow-soft)',
                  }}
                >
                  {!avatar && (name?.charAt(0).toUpperCase() || 'A')}
                </div>
                <label
                  aria-label="Upload student photo"
                  title="Upload student photo"
                  htmlFor="avatar-upload"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: 'var(--accent-blue)',
                    color: 'white',
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    border: '2px solid #ffffff',
                  }}
                >
                  <Camera size={12} />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarUpload}
                />
              </div>
              <div className="na-photo-copy">
              <strong>Student photo</strong>
              <span>{isUploadingImage ? 'Uploading...' : 'Optional · Click the camera to upload'}</span>
            </div>
            </div>
            {/* Fields Grid */}
            <div className="na-fields">
              <Input
                label="Full Name *"
                placeholder="e.g. Rohan Sharma"
                required
                value={name}
                error={errors.name}
                onChange={(e) => handleChange('name', e.target.value, setName)}
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="e.g. rohan@gmail.com"
                value={email}
                error={errors.email}
                onChange={(e) => handleChange('email', e.target.value, setEmail)}
              />
              <Input
                label="Mobile Number *"
                placeholder="e.g. 9876543210"
                required
                maxLength={10}
                value={mobile}
                error={errors.mobile}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  handleChange('mobile', val, setMobile);
                }}
              />
              <Input
                label="Password *"
                type="password"
                placeholder="Min 6 characters"
                required
                value={password}
                error={errors.password}
                onChange={(e) => handleChange('password', e.target.value, setPassword)}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label className="custom-input-label">Gender</label>
                <Select
                  value={gender}
                  onChange={(val) => setGender(val)}
                  options={genderOptions}
                />
              </div>
              <Input
                label="Aadhar Card Number"
                placeholder="e.g. 123456789012"
                maxLength={12}
                value={aadharNumber}
                error={errors.aadharNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                  handleChange('aadharNumber', val, setAadharNumber);
                }}
              />
              <div ref={dateContainerRef} style={{ position: 'relative' }}>
                <label className="custom-input-label">Admission Date *</label>
                <button type="button" className="na-date-trigger" aria-label="Choose admission date" aria-expanded={showCalendarPicker} onClick={toggleCalendarPicker}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-navy)' }}>
                    {joiningDate ? new Date(joiningDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Select date'}
                  </span>
                  <CalendarIcon size={16} style={{ color: 'var(--na-blue)' }} />
                </button>
                {showCalendarPicker && (
                  <div
                    style={{
                      position: 'absolute',
                      ...(openDirection === 'top'
                        ? { bottom: 'calc(100% + 6px)' }
                        : { top: 'calc(100% + 6px)' }),
                      left: 0,
                      zIndex: 9999,
                      boxShadow: '0 20px 45px rgba(0, 0, 0, 0.18), 0 4px 14px rgba(0, 0, 0, 0.08)',
                      borderRadius: '14px',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <CustomCalendar
                      compact
                      value={joiningDate ? new Date(joiningDate) : new Date()}
                      onChange={(d) => {
                        const yyyy = d.getFullYear();
                        const mm = String(d.getMonth() + 1).padStart(2, '0');
                        const dd = String(d.getDate()).padStart(2, '0');
                        setJoiningDate(`${yyyy}-${mm}-${dd}`);
                        setShowCalendarPicker(false);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
       </section>
        {/* SECTION 2: BRANCH & SUBSCRIPTION */}
        <section className="na-card na-subscription">
       <Card elevation="sm" style={{ padding: 0, background: 'transparent', border: 'none', boxShadow: 'none', overflow: 'visible' }}>
          <div className="na-section-heading">
            <Layers size={16} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
            <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-navy)' }}>
              Branch & Subscription
            </h3>
          </div>
          <div className="na-fields">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className="custom-input-label">Target Branch *</label>
              <Select
                value={branchId}
                onChange={(val) => setBranchId(val)}
                placeholder="Select target branch"
                options={branches?.map((b: any) => ({
                  value: b.id,
                  label: b.name,
                })) || []}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className="custom-input-label">Seating Shift</label>
              <Select
                value={shiftId}
                onChange={(val) => {
                  if (val === 'ADD_NEW_SHIFT') {
                    navigate('/billing?tab=shifts&action=add-shift', { state: { tab: 1, openCreateShift: true } });
                    return;
                  }
                  setShiftId(val);
                  const selectedShift = shifts?.find((s: any) => s.id === val);
                  if (selectedShift && selectedShift.customPricing && selectedShift.customPricing.length > 0) {
                    setSelectedDurationLabel(selectedShift.customPricing[0].label);
                    setAmountPaid(selectedShift.customPricing[0].price.toString());
                  } else {
                    setSelectedDurationLabel('');
                    setAmountPaid(selectedShift ? selectedShift.price.toString() : '');
                  }
                }}
                placeholder="Select a seating shift"
                options={shiftOptions}
                disabled={isLoadingShifts || !!shiftsError}
              />
            </div>
            {shiftId && shifts?.find((s: any) => s.id === shiftId)?.customPricing?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label className="custom-input-label">Duration</label>
                <Select
                  value={selectedDurationLabel}
                  onChange={(val) => {
                    setSelectedDurationLabel(val);
                    const cp = shifts.find((s: any) => s.id === shiftId)?.customPricing?.find((c: any) => c.label === val);
                    if (cp) {
                      setAmountPaid(cp.price.toString());
                    }
                  }}
                  placeholder="Select Duration"
                  options={shifts.find((s: any) => s.id === shiftId).customPricing.map((cp: any) => ({
                    value: cp.label,
                    label: `${cp.label} (₹${cp.price})`,
                  }))}
                />
              </div>
            )}
            {shiftId && (
              <>
                <Input
                  label={`Amount Paid (Price: ₹${selectedShiftPrice})`}
                  type="number"
                  placeholder="e.g. 500"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                />
                <div className="na-due-panel">
                  <label className="custom-input-label">Due Amount</label>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: dueAmount > 0 ? 'var(--status-red)' : 'var(--status-emerald)' }}>
                      ₹{dueAmount}
                    </div>
                    {selectedShiftPrice - (parseFloat(amountPaid) || 0) > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f8fafc', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-card)' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-slate)', textTransform: 'uppercase', marginBottom: '0' }}>Discount (₹)</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={discountAmount}
                          onChange={(e) => setDiscountAmount(e.target.value)}
                          style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(15, 23, 42, 0.05)', fontSize: '0.8rem', color: 'var(--text-navy)', outline: 'none', backgroundColor: '#ffffff', width: '80px', textAlign: 'right' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
       </section>
        {/* SECTION 3: CONTACT & ADDRESS */}
        <section className="na-card na-contact">
       <Card elevation="sm" style={{ padding: 0, background: 'transparent', border: 'none', boxShadow: 'none', overflow: 'visible' }}>
          <div className="na-section-heading">
            <MapPin size={16} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
            <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-navy)' }}>
              Contact & Address
            </h3>
          </div>
          <div className="na-fields">
            <Input
              label="Guardian Name"
              placeholder="e.g. Satish Sharma"
              value={guardianName}
              error={errors.guardianName}
              onChange={(e) => handleChange('guardianName', e.target.value, setGuardianName)}
            />
            <Input
              label="Guardian Mobile"
              placeholder="e.g. 9876543211"
              maxLength={10}
              value={guardianMobile}
              error={errors.guardianMobile}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                handleChange('guardianMobile', val, setGuardianMobile);
              }}
            />
            <div style={{ gridColumn: '1 / -1' }}>
              <Input
                label="Full Address"
                placeholder="e.g. Flat 102, Block B, Preet Vihar, Delhi"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>
        </Card>
       </section>
        {/* SUBMIT */}
        <div className="na-submit-row">
          <p className="na-footer-copy">Review the details before completing admission.</p>
          <div className="na-actions">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
            style={{ borderRadius: '10px', minWidth: '110px' }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            style={{ borderRadius: '10px', minWidth: '160px' }}
          >
            Admit Student
          </Button>
          </div>
        </div>
      </form>
      {/* Success Modal (Rendered via Portal to guarantee exact screen center positioning) */}
      {isSuccessModalOpen && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.35)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '32px',
            width: '90%',
            maxWidth: '420px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(15, 23, 42, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            textAlign: 'center',
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              color: '#059669',
            }}>
              ✓
            </div>
            <div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-navy)', letterSpacing: '-0.01em' }}>
                Admission Complete
              </h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-slate)', lineHeight: '1.5' }}>
                <strong>{createdStudent?.name}</strong> has been admitted successfully.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              <Button
                variant="primary"
                style={{ borderRadius: '12px', width: '100%', padding: '10px 0', fontWeight: 700 }}
                onClick={() => {
                  navigate('/seats', {
                    state: {
                      preselectedStudentId: createdStudent?.id,
                      preselectedStudentName: createdStudent?.name || name,
                      preselectedJoiningDate: createdStudent?.joiningDate || joiningDate,
                      preselectedShiftId: createdStudent?.shiftId || shiftId,
                    }
                  });
                }}
              >
                Allocate a Seat Now
              </Button>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%' }}>
                <Button
                  variant="outline"
                  style={{ borderRadius: '12px', fontSize: '0.8rem', padding: '8px 0' }}
                  onClick={() => navigate('/students')}
                >
                  Go to Students
                </Button>
                <Button
                  variant="outline"
                  style={{ borderRadius: '12px', fontSize: '0.8rem', padding: '8px 0', borderColor: 'transparent', backgroundColor: '#f1f5f9', color: '#475569' }}
                  onClick={handleResetForm}
                >
                  Add Another
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
