import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  useGetStudentByIdQuery, 
  useGetSeatMapQuery, 
  useTransferSeatMutation 
} from '../store/api';
import { useToast } from '../components/ui/ToastContext';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Card } from '../components/ui/Card';
import { ArrowLeft, Sparkles, Armchair, Building2, Layers, Landmark } from 'lucide-react';
import '../components/ui/Globals.css';

export default function TransferSeat() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const allocationId = searchParams.get('allocationId') || '';
  const studentId = searchParams.get('studentId') || '';

  // Get student details
  const { data: student, isLoading: isStudentLoading } = useGetStudentByIdQuery(studentId, { skip: !studentId });

  // Get seat map for student's branch
  const branchId = student?.branchId || '';
  const { data: seatMap, isLoading: isSeatMapLoading } = useGetSeatMapQuery(branchId, { skip: !branchId });

  // Transfer mutation
  const [transferSeat, { isLoading: isTransferring }] = useTransferSeatMutation();

  // Selection states
  const [targetFloorId, setTargetFloorId] = useState('');
  const [targetRoomId, setTargetRoomId] = useState('');
  const [targetSeatId, setTargetSeatId] = useState('');

  // Find active allocation details
  const activeAllocation = useMemo(() => {
    return student?.allocations?.find((a: any) => a.isActive);
  }, [student]);

  // Set default Floor and Room when seatMap loads
  useEffect(() => {
    if (seatMap && seatMap.length > 0 && !targetFloorId) {
      setTargetFloorId(seatMap[0].id);
      if (seatMap[0].rooms && seatMap[0].rooms.length > 0) {
        setTargetRoomId(seatMap[0].rooms[0].id);
      }
    }
  }, [seatMap, targetFloorId]);

  // Handle floor changes
  const handleFloorChange = (floorId: string) => {
    setTargetFloorId(floorId);
    setTargetSeatId('');
    const floor = seatMap?.find((f: any) => f.id === floorId);
    if (floor?.rooms && floor.rooms.length > 0) {
      setTargetRoomId(floor.rooms[0].id);
    } else {
      setTargetRoomId('');
    }
  };

  // Get options
  const floorOptions = useMemo(() => {
    return seatMap?.map((f: any) => ({ value: f.id, label: f.name })) || [];
  }, [seatMap]);

  const roomOptions = useMemo(() => {
    const floor = seatMap?.find((f: any) => f.id === targetFloorId);
    return floor?.rooms?.map((r: any) => ({ value: r.id, label: r.name })) || [];
  }, [seatMap, targetFloorId]);

  const availableSeats = useMemo(() => {
    const floor = seatMap?.find((f: any) => f.id === targetFloorId);
    const room = floor?.rooms?.find((r: any) => r.id === targetRoomId);
    return room?.seats?.filter((s: any) => s.status === 'AVAILABLE') || [];
  }, [seatMap, targetFloorId, targetRoomId]);

  const handleConfirmTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocationId || !targetSeatId) return;

    try {
      await transferSeat({
        allocationId,
        targetSeatId,
      }).unwrap();

      showToast('Student transferred successfully!', 'success');
      navigate('/seats');
    } catch (err: any) {
      showToast(err?.data?.message || 'Failed to transfer seat', 'error');
    }
  };

  if (isStudentLoading || isSeatMapLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', color: 'var(--accent-blue)' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid rgba(37, 99, 235, 0.1)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!student || !activeAllocation) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', padding: '24px', textAlign: 'center' }}>
        <Card style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <Armchair size={48} color="var(--text-slate)" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-navy)' }}>No Active Seat Found</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-slate)' }}>
            This student does not currently have an active seat allocation. You can only transfer students who are currently seated.
          </p>
          <Button variant="primary" onClick={() => navigate('/seats')}>
            Go to Seat Map
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header and Back Link */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ border: 'none', background: '#ffffff', boxShadow: 'var(--shadow-soft)', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-navy)' }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Seat Transfer Portal <Sparkles size={20} color="var(--accent-blue)" />
          </h1>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: 'var(--text-slate)', fontWeight: 500 }}>
            Move student to a different seat in the same branch location.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
        {/* Left Side: Student Info & Current Seat */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-navy)', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>Student Profile</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: 'var(--accent-blue)', color: 'white', fontWeight: 800, fontSize: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {student.user?.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-navy)' }}>{student.user?.name}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-slate)', marginTop: '2px' }}>{student.user?.email}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-slate)' }}>{student.user?.mobile}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px', background: '#f8fafc', padding: '12px', borderRadius: '12px' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-slate)', textTransform: 'uppercase' }}>Current Seat</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-blue)', marginTop: '2px' }}>Seat {activeAllocation.seat?.number}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-slate)', textTransform: 'uppercase' }}>Current Shift</span>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-navy)', marginTop: '2px' }}>{activeAllocation.shift?.name}</div>
              </div>
            </div>
          </Card>

          <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(37, 99, 235, 0.02)', borderColor: 'rgba(37, 99, 235, 0.1)' }}>
            <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-navy)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Landmark size={16} color="var(--accent-blue)" /> Transfer Rules
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.8rem', color: 'var(--text-slate)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>Student will be transferred immediately upon confirming.</li>
              <li>The current seat (Seat {activeAllocation.seat?.number}) will become available for other students.</li>
              <li>The shift and subscription dates remain exactly the same.</li>
            </ul>
          </Card>
        </div>

        {/* Right Side: Select Target Location */}
        <Card style={{ padding: '20px' }}>
          <form onSubmit={handleConfirmTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-navy)', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>Target Location</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-slate)', display: 'flex', alignItems: 'center', gap: '4px' }}><Layers size={14} /> Floor</label>
                <Select
                  value={targetFloorId}
                  onChange={handleFloorChange}
                  placeholder="Select Floor"
                  options={floorOptions}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-slate)', display: 'flex', alignItems: 'center', gap: '4px' }}><Building2 size={14} /> Room</label>
                <Select
                  value={targetRoomId}
                  onChange={(val) => { setTargetRoomId(val); setTargetSeatId(''); }}
                  placeholder="Select Room"
                  disabled={!targetFloorId}
                  options={roomOptions}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-slate)' }}>Available Seats in Room</label>
              
              {availableSeats.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '10px', maxHeight: '200px', overflowY: 'auto', padding: '4px' }}>
                  {availableSeats.map((seat: any) => (
                    <div 
                      key={seat.id}
                      onClick={() => setTargetSeatId(seat.id)}
                      style={{
                        padding: '12px 6px',
                        borderRadius: '10px',
                        border: targetSeatId === seat.id ? '2px solid var(--accent-blue)' : '1px solid #e2e8f0',
                        backgroundColor: targetSeatId === seat.id ? 'rgba(37, 99, 235, 0.05)' : '#ffffff',
                        textAlign: 'center',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        color: 'var(--text-navy)',
                        transition: 'all 0.15s ease',
                        boxShadow: targetSeatId === seat.id ? 'var(--shadow-hover)' : 'none'
                      }}
                    >
                      {seat.number}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-slate)', border: '1px dashed #cbd5e1', borderRadius: '12px', backgroundColor: '#f8fafc', fontSize: '0.8rem' }}>
                  No available seats in this room.
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              style={{ backgroundColor: 'var(--accent-blue)', borderColor: 'var(--accent-blue)', marginTop: '8px', padding: '12px' }} 
              disabled={!targetSeatId || isTransferring} 
              isLoading={isTransferring}
            >
              Confirm Seat Transfer
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
