import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import {
  useGetStudentsQuery,
  useCreateStudentMutation,
  useUpdateStudentStatusMutation,
  useDeleteStudentMutation,
  useGetBranchesQuery,
} from '../store/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import '../components/ui/Globals.css';
import {
  Plus,
  Check,
  X,
  Trash2,
  IdCard,
  Loader2
} from 'lucide-react';

export default function Students() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { data: branches } = useGetBranchesQuery(user?.workspaceId, { skip: !user?.workspaceId });

  const [search, setSearch] = useState('');
  const [page] = useState(1);
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [openCard, setOpenCard] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianMobile, setGuardianMobile] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');
  const [branchId, setBranchId] = useState('');

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data, isLoading } = useGetStudentsQuery({
    search,
    branchId: branchId || undefined,
    page,
    limit: 10,
  });

  const [createStudent, { isLoading: isCreating }] = useCreateStudentMutation();
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
      <Card elevation="sm" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ width: '280px' }}>
          <Input
            placeholder="Search by Name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginBottom: 0 }}
          />
        </div>
        <div style={{ width: '200px' }}>
          <select 
            className="custom-input" 
            value={branchId} 
            onChange={(e) => setBranchId(e.target.value)}
          >
            <option value="">All Branches</option>
            {branches?.map((b: any) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Roster Table */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem', color: 'var(--primary)' }}>
          <Loader2 className="spinner" size={40} />
        </div>
      ) : (
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Contact Info</th>
                <th>Aadhar Card</th>
                <th>Admission Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.students.map((student: any) => (
                <tr key={student.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="avatar">
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
                  <td>{student.aadharNumber || 'N/A'}</td>
                  <td>{new Date(student.joiningDate).toLocaleDateString()}</td>
                  <td>{getStatusBadge(student.status)}</td>
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
              ))}
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
            <div>
              <label className="custom-input-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Target Branch</label>
              <select 
                className="custom-input" 
                required 
                value={branchId} 
                onChange={(e) => setBranchId(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="" disabled>Select a branch</option>
                {branches?.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
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
            <Button type="button" variant="text" onClick={() => setOpenAdd(false)}>Cancel</Button>
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
                <div style={{ width: '100%', marginBottom: '1.5rem' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>Mobile:</span>
                  <div style={{ fontWeight: 500, marginBottom: '0.5rem', fontSize: '0.875rem' }}>{selectedStudent.user?.mobile}</div>

                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>Branch:</span>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{selectedStudent.branch?.name}</div>
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
    </div>
  );
}
