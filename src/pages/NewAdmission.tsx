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
import { ArrowLeft, UserPlus, MapPin, Layers, Camera, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { getTodayYYYYMMDD, formatDateDisplay } from '../utils/dateUtils';
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
  const [amountPaid, setAmountPaid] = useState('');
  const [avatar, setAvatar] = useState('');
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
    return shift ? shift.price : 0;
  }, [shiftId, shifts]);

  const dueAmount = useMemo(() => {
    const paid = parseFloat(amountPaid) || 0;
    return Math.max(0, selectedShiftPrice - paid);
  }, [selectedShiftPrice, amountPaid]);

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
        amountPaid: amountPaid === '' ? 0 : Number(amountPaid),
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
            label: `${s.name} (₹${s.price})`,
          })),
        ];

    return [
      ...baseOptions,
      { value: 'ADD_NEW_SHIFT', label: '+ Add New Shift', isAction: true },
    ];
  }, [shifts, isLoadingShifts, shiftsError]);

  return (
    <div style={{ width: '100%', maxWidth: '780px', margin: '0 auto', paddingBottom: '32px' }} className="animate-fade-in">
      {/* Responsive CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 600px) {
          .na-avatar-row { flex-direction: column !important; align-items: center !important; gap: 16px !important; }
          .na-avatar-row > div:last-child { min-width: 100% !important; }
          .na-submit-row { flex-direction: column-reverse !important; }
          .na-submit-row > button { width: 100% !important; min-width: unset !important; }
        }
      `}} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-card)',
            borderRadius: '8px',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-navy)',
            flexShrink: 0,
          }}
        >
          <ArrowLeft size={16} />
        </button>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-navy)' }}>
            New Admission
          </h1>
          <span style={{ fontSize: '0.775rem', color: 'var(--text-slate)' }}>
            Register a student and set up subscription
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* SECTION 1: PERSONAL DETAILS */}
        <Card elevation="sm" style={{ padding: '16px 18px', background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border-card)', overflow: 'visible' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid rgba(15, 23, 42, 0.05)', paddingBottom: '10px' }}>
            <UserPlus size={16} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
            <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-navy)' }}>
              Personal Details
            </h3>
          </div>

          <div className="na-avatar-row" style={{ display: 'flex', gap: '20px', flexDirection: 'row', alignItems: 'flex-start' }}>
            {/* Avatar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <div style={{ position: 'relative' }}>
                <div 
                  style={{ 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '50%', 
                    background: avatar ? `url(${avatar}) no-repeat center center / cover` : 'linear-gradient(135deg, var(--accent-blue) 0%, #3b82f6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '2rem',
                    border: '2px solid #ffffff',
                    boxShadow: 'var(--shadow-soft)',
                  }}
                >
                  {!avatar && (name?.charAt(0).toUpperCase() || 'A')}
                </div>
                <label 
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
              <span style={{ fontSize: '0.7rem', color: 'var(--text-slate)', fontWeight: 600 }}>
                {isUploadingImage ? 'Uploading...' : 'Photo'}
              </span>
            </div>

            {/* Fields Grid */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '14px', minWidth: 0 }}>
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
                <div
                  onClick={toggleCalendarPicker}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 12px',
                    height: '40px',
                    borderRadius: '8px',
                    border: showCalendarPicker ? '1.5px solid #D97706' : '1px solid var(--border-color)',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: showCalendarPicker ? '0 0 0 3px rgba(217, 119, 6, 0.15)' : 'none'
                  }}
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-navy)' }}>
                    {joiningDate ? new Date(joiningDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Select date'}
                  </span>
                  <CalendarIcon size={16} style={{ color: '#D97706' }} />
                </div>

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

        {/* SECTION 2: BRANCH & SUBSCRIPTION */}
        <Card elevation="sm" style={{ padding: '16px 18px', background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border-card)', overflow: 'visible' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid rgba(15, 23, 42, 0.05)', paddingBottom: '10px' }}>
            <Layers size={16} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
            <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-navy)' }}>
              Branch & Subscription
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '14px' }}>
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
                  setAmountPaid(selectedShift ? selectedShift.price.toString() : '');
                }}
                placeholder="Select a seating shift"
                options={shiftOptions}
                disabled={isLoadingShifts || !!shiftsError}
              />
            </div>
            
            {shiftId && (
              <>
                <Input
                  label={`Amount Paid (Price: ₹${selectedShiftPrice})`}
                  type="number"
                  placeholder="e.g. 500"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center' }}>
                  <label className="custom-input-label">Due Amount</label>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: dueAmount > 0 ? 'var(--status-red)' : 'var(--status-emerald)' }}>
                    ₹{dueAmount}
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* SECTION 3: CONTACT & ADDRESS */}
        <Card elevation="sm" style={{ padding: '16px 18px', background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid rgba(15, 23, 42, 0.05)', paddingBottom: '10px' }}>
            <MapPin size={16} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
            <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-navy)' }}>
              Contact & Address
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '14px' }}>
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

        {/* SUBMIT */}
        <div className="na-submit-row" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' }}>
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
