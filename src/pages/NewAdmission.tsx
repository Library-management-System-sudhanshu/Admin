import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import {
  useCreateStudentMutation,
  useGetBranchesQuery,
  useGetShiftsQuery,
} from '../store/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useToast } from '../components/ui/ToastContext';
import { ArrowLeft, UserPlus, MapPin, Layers } from 'lucide-react';
import '../components/ui/Globals.css';

export default function NewAdmission() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useSelector((state: RootState) => state.auth);

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
        if (!/^[a-zA-Z\s]*$/.test(value)) {
          errorMsg = 'Name must contain only letters';
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
        if (!/^[a-zA-Z\s]*$/.test(value)) {
          errorMsg = 'Guardian name must contain only letters';
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
    setter(value);
    validateField(field, value);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) newErrors.name = 'Student name is required';
    if (!email.trim()) newErrors.email = 'Email address is required';
    if (!mobile.trim()) newErrors.mobile = 'Mobile number is required';
    if (!branchId) newErrors.branchId = 'Target branch is required';

    if (name.trim() && !/^[a-zA-Z\s]{2,50}$/.test(name.trim())) {
      newErrors.name = 'Name must contain only letters (2-50 chars)';
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
    
    if (guardianName.trim() && !/^[a-zA-Z\s]{2,50}$/.test(guardianName.trim())) {
      newErrors.guardianName = 'Guardian name must contain only letters';
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
      await createStudent({
        name,
        email,
        mobile,
        password,
        gender,
        address,
        guardianName: guardianName || undefined,
        guardianMobile: guardianMobile || undefined,
        aadharNumber: aadharNumber || undefined,
        branchId,
        shiftId: shiftId || undefined,
        workspaceId: user?.workspaceId,
      }).unwrap();

      showToast('Student admitted successfully!', 'success');
      navigate('/students');
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
    if (!shifts || shifts.length === 0) {
      return [{ value: '', label: 'No Shift (Admission only)' }];
    }
    return [
      { value: '', label: 'No Shift (Admission only)' },
      ...shifts.map((s: any) => ({
        value: s.id,
        label: `${s.name} (₹${s.price})`,
      })),
    ];
  }, [shifts, isLoadingShifts, shiftsError]);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '40px' }} className="animate-fade-in">
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-card)',
            borderRadius: '10px',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-navy)',
            boxShadow: 'var(--shadow-soft)',
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-navy)', letterSpacing: '-0.02em' }}>
            New Admission
          </h1>
          <span style={{ fontSize: '0.825rem', color: 'var(--text-slate)' }}>
            Register a new student profile and set up their subscription.
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* CARD 1: PERSONAL INFORMATION */}
        <Card elevation="sm" style={{ padding: '24px', background: '#ffffff', borderRadius: '18px', border: '1px solid var(--border-card)', overflow: 'visible' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid rgba(15, 23, 42, 0.05)', paddingBottom: '12px' }}>
            <UserPlus size={18} style={{ color: 'var(--accent-blue)' }} />
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-navy)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              Personal Details
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            <Input
              label="Full Name *"
              placeholder="e.g. Rohan Sharma"
              required
              value={name}
              error={errors.name}
              onChange={(e) => handleChange('name', e.target.value, setName)}
            />
            <Input
              label="Email Address *"
              type="email"
              placeholder="e.g. rohan@gmail.com"
              required
              value={email}
              error={errors.email}
              onChange={(e) => handleChange('email', e.target.value, setEmail)}
            />
            <Input
              label="Mobile Number *"
              placeholder="e.g. 9876543210"
              required
              value={mobile}
              error={errors.mobile}
              onChange={(e) => handleChange('mobile', e.target.value, setMobile)}
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
              value={aadharNumber}
              error={errors.aadharNumber}
              onChange={(e) => handleChange('aadharNumber', e.target.value, setAadharNumber)}
            />
          </div>
        </Card>

        {/* CARD 2: CONTACT & ADDRESS */}
        <Card elevation="sm" style={{ padding: '24px', background: '#ffffff', borderRadius: '18px', border: '1px solid var(--border-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid rgba(15, 23, 42, 0.05)', paddingBottom: '12px' }}>
            <MapPin size={18} style={{ color: 'var(--accent-blue)' }} />
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-navy)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              Contact & Address
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
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
              value={guardianMobile}
              error={errors.guardianMobile}
              onChange={(e) => handleChange('guardianMobile', e.target.value, setGuardianMobile)}
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

        {/* CARD 3: ACADEMIC & SUBSCRIPTION PLAN */}
        <Card elevation="sm" style={{ padding: '24px', background: '#ffffff', borderRadius: '18px', border: '1px solid var(--border-card)', overflow: 'visible' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid rgba(15, 23, 42, 0.05)', paddingBottom: '12px' }}>
            <Layers size={18} style={{ color: 'var(--accent-blue)' }} />
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-navy)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              Branch & Subscription Plan
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
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
              <label className="custom-input-label">Select Seating Shift</label>
              <Select
                value={shiftId}
                onChange={(val) => setShiftId(val)}
                placeholder="Select a seating shift"
                options={shiftOptions}
                disabled={isLoadingShifts || !!shiftsError}
              />
            </div>
          </div>
        </Card>

        {/* SUBMIT BUTTONS */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '8px' }}>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
            style={{ borderRadius: '12px', minWidth: '120px' }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            style={{ borderRadius: '12px', minWidth: '180px' }}
          >
            Admit Student
          </Button>
        </div>

      </form>
    </div>
  );
}
