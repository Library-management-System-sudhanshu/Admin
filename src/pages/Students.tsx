import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import {
  useGetStudentsQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useUpdateStudentStatusMutation,
  useDeleteStudentMutation,
  useGetBranchesQuery,
  useGetShiftsQuery,
} from '../store/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import '../components/ui/Globals.css';
import {
  Plus,
  Check,
  X,
  Trash2,
  IdCard,
  Loader2,
  Edit2
} from 'lucide-react';

export default function Students() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { data: branches } = useGetBranchesQuery(user?.workspaceId, { skip: !user?.workspaceId });
  const { data: shifts } = useGetShiftsQuery(user?.workspaceId, { skip: !user?.workspaceId });

  const [search, setSearch] = useState('');
  const [page] = useState(1);
  const [filterShiftId, setFilterShiftId] = useState('');
  const [filterExpiration, setFilterExpiration] = useState('');
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [openCard, setOpenCard] = useState(false);

  const [openEdit, setOpenEdit] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianMobile, setGuardianMobile] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');
  const [branchId, setBranchId] = useState('');

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Edit Form Fields
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editGuardianName, setEditGuardianName] = useState('');
  const [editGuardianMobile, setEditGuardianMobile] = useState('');
  const [editAadharNumber, setEditAadharNumber] = useState('');
  const [editBranchId, setEditBranchId] = useState('');
  const [editJoiningDate, setEditJoiningDate] = useState('');
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const { data, isLoading } = useGetStudentsQuery({
    search,
    branchId: branchId || undefined,
    page,
    limit: 10,
  });

  const filteredStudents = React.useMemo(() => {
    if (!data?.students) return [];

    return data.students.filter((student: any) => {
      const activeAllocation = student.allocations?.find((a: any) => a.isActive);

      // Filter by Shift
      if (filterShiftId) {
        if (!activeAllocation || activeAllocation.shiftId !== filterShiftId) {
          return false;
        }
      }

      // Filter by Expiration
      if (filterExpiration) {
        if (filterExpiration === 'NO_SEAT') {
          if (activeAllocation) return false;
        } else {
          if (!activeAllocation) return false;

          const end = new Date(activeAllocation.endDate);
          const today = new Date();
          end.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);
          const diffTime = end.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (filterExpiration === 'ACTIVE') {
            if (diffDays < 0) return false;
          } else if (filterExpiration === 'EXPIRED') {
            if (diffDays >= 0) return false;
          } else if (filterExpiration === 'EXPIRING_SOON') {
            if (diffDays < 0 || diffDays > 7) return false;
          }
        }
      }

      return true;
    });
  }, [data?.students, filterShiftId, filterExpiration]);

  const [createStudent, { isLoading: isCreating }] = useCreateStudentMutation();
  const [updateStudent, { isLoading: isUpdating }] = useUpdateStudentMutation();
  const [updateStatus] = useUpdateStudentStatusMutation();
  const [deleteStudent] = useDeleteStudentMutation();

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
        } else if (value.trim().length > 50) {
          errorMsg = 'Guardian name must be at most 50 characters';
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
          errorMsg = 'Aadhar number must contain only digits';
        } else if (value.trim().length > 0 && value.trim().length !== 12) {
          errorMsg = 'Aadhar number must be exactly 12 digits';
        }
        break;
      default:
        break;
    }
    
    setErrors((prev) => {
      if (errorMsg) {
        return { ...prev, [field]: errorMsg };
      } else {
        const next = { ...prev };
        delete next[field];
        return next;
      }
    });
  };

  const handleOpenEdit = (student: any) => {
    setEditingStudent(student);
    setEditName(student.user?.name || '');
    setEditEmail(student.user?.email || '');
    setEditMobile(student.user?.mobile || '');
    setEditPassword('');
    setEditGuardianName(student.guardianName || '');
    setEditGuardianMobile(student.guardianMobile || '');
    setEditAadharNumber(student.aadharNumber || '');
    setEditBranchId(student.branchId || '');
    setEditJoiningDate(student.joiningDate ? new Date(student.joiningDate).toISOString().split('T')[0] : '');
    setEditErrors({});
    setOpenEdit(true);
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!editName.trim()) newErrors.name = 'Name is required';
    if (!editEmail.trim()) newErrors.email = 'Email is required';
    if (!editMobile.trim()) newErrors.mobile = 'Mobile is required';
    if (editPassword && editPassword.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setEditErrors(newErrors);
      return;
    }

    try {
      await updateStudent({
        id: editingStudent.id,
        name: editName,
        email: editEmail,
        mobile: editMobile,
        password: editPassword || undefined,
        guardianName: editGuardianName,
        guardianMobile: editGuardianMobile,
        aadharNumber: editAadharNumber,
        branchId: editBranchId,
        joiningDate: editJoiningDate,
      }).unwrap();
      setOpenEdit(false);
      setEditingStudent(null);
      setEditPassword('');
    } catch (err) {
      alert('Error updating student');
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (!/^[a-zA-Z\s]{2,50}$/.test(name.trim())) {
      newErrors.name = 'Name must be 2-50 characters and contain only letters';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Invalid email address';
    }

    if (!mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(mobile.trim())) {
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

  const handleChange = (field: string, value: string, setter: (val: string) => void) => {
    setter(value);
    validateField(field, value);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      await createStudent({
        name,
        email,
        mobile,
        password: password || undefined,
        guardianName,
        guardianMobile,
        aadharNumber,
        branchId,
        workspaceId: user?.workspaceId,
      }).unwrap();
      setOpenAdd(false);
      setErrors({});
      // Reset form
      setName('');
      setEmail('');
      setMobile('');
      setPassword('');
      setGuardianName('');
      setGuardianMobile('');
      setAadharNumber('');
      setBranchId('');
    } catch (err) {
      alert('Error creating student');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    await updateStatus({ id, status });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      await deleteStudent(id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="badge badge-success">{status}</span>;
      case 'PENDING':
        return <span className="badge badge-warning">{status}</span>;
      case 'REJECTED':
        return <span className="badge badge-danger">{status}</span>;
      default:
        return <span className="badge badge-info">{status}</span>;
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
          Student Records
        </h1>
        <Button 
          variant="primary" 
          onClick={() => setOpenAdd(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={18} /> New Student
        </Button>
      </div>

      {/* Filters Toolbar */}
      <Card
        elevation="sm"
        style={{
          padding: '0.75rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'nowrap',
          overflow: 'visible',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '0.75rem',
        }}
      >
        <div style={{ width: '240px', flexShrink: 0 }}>
          <Input
            placeholder="Search by Name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="no-margin"
          />
        </div>
        <div style={{ width: '180px', flexShrink: 0 }}>
          <Select
            value={branchId}
            onChange={(val) => setBranchId(val)}
            placeholder="All Branches"
            options={[
              { value: '', label: 'All Branches' },
              ...(branches?.map((b: any) => ({
                value: b.id,
                label: b.name,
              })) || [])
            ]}
          />
        </div>
        <div style={{ width: '180px', flexShrink: 0 }}>
          <Select
            value={filterShiftId}
            onChange={(val) => setFilterShiftId(val)}
            placeholder="All Shifts"
            options={[
              { value: '', label: 'All Shifts' },
              ...(shifts?.map((s: any) => ({
                value: s.id,
                label: `${s.name} (${s.startTime}-${s.endTime})`,
              })) || [])
            ]}
          />
        </div>
        <div style={{ width: '180px', flexShrink: 0 }}>
          <Select
            value={filterExpiration}
            onChange={(val) => setFilterExpiration(val)}
            placeholder="All Statuses"
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'ACTIVE', label: 'Active Seat' },
              { value: 'EXPIRING_SOON', label: 'Expiring Soon' },
              { value: 'EXPIRED', label: 'Expired Seat' },
              { value: 'NO_SEAT', label: 'No Seat' },
            ]}
          />
        </div>
      </Card>

      {/* Roster Table */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem', color: 'var(--primary)' }}>
          <Loader2 className="spinner" size={40} />
        </div>
      ) : (
        <div className="custom-table-container">
          <table className="custom-table" style={{ minWidth: '900px' }}>
            <thead>
              <tr>
                <th>Student</th>
                <th>Contact Info</th>
                <th style={{ whiteSpace: 'nowrap' }}>Seat & Shift</th>
                <th>Aadhar Card</th>
                <th>Admission Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student: any) => {
                const avatarBorderColor = 
                  student.status === 'APPROVED' ? 'var(--success)' :
                  student.status === 'PENDING' ? 'var(--warning)' :
                  student.status === 'REJECTED' ? 'var(--danger)' :
                  'var(--border-color)';

                return (
                  <tr key={student.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="avatar" style={{ border: `2.5px solid ${avatarBorderColor}`, boxSizing: 'border-box' }}>
                          {student.user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{student.user?.name}</div>
                          <div className="text-muted">{student.branch?.name || 'No Branch'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>{student.user?.email}</div>
                      <div className="text-muted">{student.user?.mobile}</div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {(() => {
                        const activeAllocation = student.allocations?.find((a: any) => a.isActive);
                        if (!activeAllocation) {
                          return <span className="text-muted" style={{ fontStyle: 'italic', fontSize: '0.875rem' }}>No Seat Allocated</span>;
                        }
                        
                        const end = new Date(activeAllocation.endDate);
                        const today = new Date();
                        end.setHours(0, 0, 0, 0);
                        today.setHours(0, 0, 0, 0);
                        const diffTime = end.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        let expColor = 'var(--text-muted)';
                        let expWeight = 'normal';
                        if (diffDays < 0) {
                          expColor = 'var(--danger)';
                          expWeight = '600';
                        } else if (diffDays <= 7) {
                          expColor = 'var(--warning)';
                          expWeight = '600';
                        }

                        const daysText = diffDays < 0 ? '(Expired)' : diffDays === 0 ? '(Today)' : `(${diffDays})`;

                        return (
                          <div style={{ fontSize: '0.875rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              Seat {activeAllocation.seat?.number || 'N/A'}
                            </span>
                            <span style={{ color: 'var(--text-secondary)', marginLeft: '0.25rem' }}>
                              ({activeAllocation.shift?.name || 'N/A'})
                            </span>
                            <span style={{ margin: '0 0.4rem', color: 'var(--text-muted)' }}>•</span>
                            <span style={{ color: expColor, fontWeight: expWeight }}>
                              {daysText}
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    <td>{student.aadharNumber || 'N/A'}</td>
                    <td>{new Date(student.joiningDate).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      {student.status === 'PENDING' && (
                        <>
                          <button 
                            className="icon-btn success" 
                            title="Approve" 
                            onClick={() => handleStatusChange(student.id, 'APPROVED')}
                          >
                            <Check size={18} />
                          </button>
                          <button 
                            className="icon-btn danger" 
                            title="Reject" 
                            onClick={() => handleStatusChange(student.id, 'REJECTED')}
                          >
                            <X size={18} />
                          </button>
                        </>
                      )}
                      <button 
                        className="icon-btn" 
                        title="Edit Student" 
                        onClick={() => handleOpenEdit(student)}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        className="icon-btn" 
                        title="ID Card" 
                        onClick={() => {
                          setSelectedStudent(student);
                          setOpenCard(true);
                        }}
                      >
                        <IdCard size={18} />
                      </button>
                      <button 
                        className="icon-btn danger" 
                        title="Delete" 
                        onClick={() => handleDelete(student.id)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Student Modal */}
      <Modal
        isOpen={openAdd}
        onClose={() => setOpenAdd(false)}
        title="Add New Admission"
        maxWidth="md"
      >
        <form id="add-student-form" onSubmit={handleAddStudent}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <Input
              label="Student Name"
              required
              value={name}
              error={errors.name}
              onChange={(e) => handleChange('name', e.target.value, setName)}
            />
            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              error={errors.email}
              onChange={(e) => handleChange('email', e.target.value, setEmail)}
            />
            <Input
              label="Mobile Number"
              required
              value={mobile}
              error={errors.mobile}
              onChange={(e) => handleChange('mobile', e.target.value, setMobile)}
            />
            <Input
              label="Password"
              type="password"
              value={password}
              error={errors.password}
              placeholder="Leave blank for default (Student@123)"
              onChange={(e) => handleChange('password', e.target.value, setPassword)}
            />
            <div>
              <label className="custom-input-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Target Branch</label>
              <Select
                value={branchId}
                onChange={(val) => setBranchId(val)}
                placeholder="Select a branch"
                options={branches?.map((b: any) => ({
                  value: b.id,
                  label: b.name,
                })) || []}
              />
            </div>
            <Input
              label="Guardian Name"
              value={guardianName}
              error={errors.guardianName}
              onChange={(e) => handleChange('guardianName', e.target.value, setGuardianName)}
            />
            <Input
              label="Guardian Mobile"
              value={guardianMobile}
              error={errors.guardianMobile}
              onChange={(e) => handleChange('guardianMobile', e.target.value, setGuardianMobile)}
            />
            <div style={{ gridColumn: '1 / -1' }}>
              <Input
                label="Aadhar Card Number"
                value={aadharNumber}
                error={errors.aadharNumber}
                onChange={(e) => handleChange('aadharNumber', e.target.value, setAadharNumber)}
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <Button type="button" variant="text" onClick={() => { setOpenAdd(false); setPassword(''); }}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isCreating}>Create Student</Button>
          </div>
        </form>
      </Modal>

      {/* ID Card Modal */}
      <Modal
        isOpen={openCard}
        onClose={() => setOpenCard(false)}
        title="Student ID Card"
        maxWidth="sm"
      >
        {selectedStudent && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
            <Card
              style={{
                width: '320px',
                border: '2px solid var(--primary)',
                borderRadius: '1rem',
                overflow: 'hidden',
                boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                backgroundColor: '#ffffff',
                color: '#0f172a'
              }}
            >
              {/* Card Header */}
              <div style={{ backgroundColor: 'var(--primary)', padding: '1rem', textAlign: 'center', color: '#ffffff' }}>
                <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.125rem' }}>STUDYFLOW HALL</h3>
                <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>Digital Student Badge</span>
              </div>

              {/* Card Body */}
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 600, marginBottom: '1rem' }}>
                  {selectedStudent.user?.name?.charAt(0).toUpperCase()}
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>
                  {selectedStudent.user?.name}
                </h2>
                <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.875rem' }}>
                  ID: SF-{selectedStudent.id.substring(0, 8).toUpperCase()}
                </p>

                {/* Details list */}
                <div style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  marginBottom: '1.5rem',
                  borderTop: '1px solid #f1f5f9',
                  borderBottom: '1px solid #f1f5f9',
                  padding: '1rem 0',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 500 }}>Mobile</span>
                    <span style={{ color: '#0f172a', fontWeight: 600 }}>{selectedStudent.user?.mobile}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 500 }}>Email</span>
                    <span style={{ color: '#0f172a', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }} title={selectedStudent.user?.email}>{selectedStudent.user?.email}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 500 }}>Branch</span>
                    <span style={{ color: '#0f172a', fontWeight: 600 }}>{selectedStudent.branch?.name || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 500 }}>Admission</span>
                    <span style={{ color: '#0f172a', fontWeight: 600 }}>{new Date(selectedStudent.joiningDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* QR Code */}
                {selectedStudent.qrCodeUrl && (
                  <img
                    src={selectedStudent.qrCodeUrl}
                    alt="QR Code"
                    style={{ width: 120, height: 120, border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}
                  />
                )}
              </div>
            </Card>
          </div>
        )}
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={openEdit}
        onClose={() => setOpenEdit(false)}
        title="Edit Student Details"
        maxWidth="md"
      >
        <form onSubmit={handleEditStudent}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <Input
              label="Student Name"
              required
              value={editName}
              error={editErrors.name}
              onChange={(e) => setEditName(e.target.value)}
            />
            <Input
              label="Email Address"
              type="email"
              required
              value={editEmail}
              error={editErrors.email}
              onChange={(e) => setEditEmail(e.target.value)}
            />
            <Input
              label="Mobile Number"
              required
              value={editMobile}
              error={editErrors.mobile}
              onChange={(e) => setEditMobile(e.target.value)}
            />
            <Input
              label="New Password"
              type="password"
              value={editPassword}
              error={editErrors.password}
              placeholder="Leave blank to keep unchanged"
              onChange={(e) => setEditPassword(e.target.value)}
            />
            <div>
              <label className="custom-input-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Target Branch</label>
              <Select
                value={editBranchId}
                onChange={(val) => setEditBranchId(val)}
                placeholder="Select a branch"
                options={branches?.map((b: any) => ({
                  value: b.id,
                  label: b.name,
                })) || []}
              />
            </div>
            <Input
              label="Guardian Name"
              value={editGuardianName}
              error={editErrors.guardianName}
              onChange={(e) => setEditGuardianName(e.target.value)}
            />
            <Input
              label="Guardian Mobile"
              value={editGuardianMobile}
              error={editErrors.guardianMobile}
              onChange={(e) => setEditGuardianMobile(e.target.value)}
            />
            <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input
                label="Admission Date"
                type="date"
                required
                value={editJoiningDate}
                onChange={(e) => setEditJoiningDate(e.target.value)}
                className="no-margin"
              />
              <Input
                label="Aadhar Card Number"
                value={editAadharNumber}
                error={editErrors.aadharNumber}
                onChange={(e) => setEditAadharNumber(e.target.value)}
                className="no-margin"
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <Button type="button" variant="text" onClick={() => { setOpenEdit(false); setEditPassword(''); }}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isUpdating}>Save Changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
