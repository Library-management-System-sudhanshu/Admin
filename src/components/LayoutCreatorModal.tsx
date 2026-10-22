import React, { useState, useEffect, useMemo } from 'react';
import {
  useAddFloorMutation,
  useAddRoomMutation,
  useAddSeatMutation,
  useAddBulkSeatsMutation,
} from '../store/api';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { Input } from './ui/Input';
import { useToast } from './ui/ToastContext';
import { Layers, DoorOpen, Armchair, FileSpreadsheet, Sparkles } from 'lucide-react';

interface LayoutCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorType: 'floor' | 'room' | 'seat';
  setCreatorType: (type: 'floor' | 'room' | 'seat') => void;
  seatMap: any[] | undefined;
  currentFloor: any;
  selectedBranch: string;
  selectedParentId?: string;
  onOpenImport?: () => void;
}

export const LayoutCreatorModal: React.FC<LayoutCreatorModalProps> = ({
  isOpen,
  onClose,
  creatorType,
  setCreatorType,
  seatMap,
  currentFloor,
  selectedBranch,
  selectedParentId,
  onOpenImport,
}) => {
  const { showToast } = useToast();
  const [addFloor] = useAddFloorMutation();
  const [addRoom] = useAddRoomMutation();
  const [addSeat] = useAddSeatMutation();
  const [addBulkSeats] = useAddBulkSeatsMutation();

  const [creatorName, setCreatorName] = useState('');
  const [parentId, setParentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parse ranges like "1-50", "A1-A20", or comma-separated "1, 2, 3"
  const parseSeatNumbers = (input: string): string[] => {
    const trimmed = input.trim();
    if (!trimmed) return [];
    if (trimmed.includes(',')) {
      return trimmed.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (trimmed.includes('-')) {
      const parts = trimmed.split('-');
      if (parts.length === 2) {
        const startStr = parts[0].trim();
        const endStr = parts[1].trim();
        const startMatch = startStr.match(/^([A-Za-z\s]*?)(\d+)$/);
        const endMatch = endStr.match(/^([A-Za-z\s]*?)(\d+)$/);
        if (startMatch && endMatch) {
          const prefix = startMatch[1] || endMatch[1] || '';
          const start = parseInt(startMatch[2], 10);
          const end = parseInt(endMatch[2], 10);
          if (!isNaN(start) && !isNaN(end) && start <= end && end - start <= 300) {
            const numbers: string[] = [];
            for (let i = start; i <= end; i++) {
              numbers.push(`${prefix}${i}`);
            }
            return numbers;
          }
        }
      }
    }
    return [trimmed];
  };

  const parsedPreview = useMemo(() => {
    if (creatorType !== 'seat') return [];
    return parseSeatNumbers(creatorName);
  }, [creatorType, creatorName]);

  // Reset fields when open
  useEffect(() => {
    if (isOpen) {
      setCreatorName('');
      if (selectedParentId) {
        setParentId(selectedParentId);
      } else if (creatorType === 'room') {
        if (currentFloor) {
          setParentId(currentFloor.id);
        } else if (seatMap && seatMap.length > 0) {
          setParentId(seatMap[0].id);
        }
      } else if (creatorType === 'seat' && currentFloor?.rooms && currentFloor.rooms.length > 0) {
        setParentId(currentFloor.rooms[0].id);
      } else {
        setParentId('');
      }
    }
  }, [isOpen, creatorType, seatMap, currentFloor, selectedParentId]);

  const handleCreate = async () => {
    if (!creatorName.trim()) {
      showToast('Please enter a name or number', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      if (creatorType === 'floor') {
        await addFloor({ branchId: selectedBranch, name: creatorName }).unwrap();
        showToast('Floor created successfully!', 'success');
      } else if (creatorType === 'room') {
        if (!parentId) {
          showToast('Please select a floor first', 'error');
          setIsSubmitting(false);
          return;
        }
        await addRoom({ floorId: parentId, name: creatorName }).unwrap();
        showToast('Room created successfully!', 'success');
      } else if (creatorType === 'seat') {
        if (!parentId) {
          showToast('Please select a room first', 'error');
          setIsSubmitting(false);
          return;
        }
        const seatNumbers = parseSeatNumbers(creatorName);
        if (seatNumbers.length > 1) {
          try {
            await addBulkSeats({ roomId: parentId, numbers: seatNumbers }).unwrap();
            showToast(`${seatNumbers.length} seats created in one go!`, 'success');
          } catch (bulkErr: any) {
            // Fallback to parallel requests if bulk API is not supported on older backend
            await Promise.all(
              seatNumbers.map((num) => addSeat({ roomId: parentId, number: num }).unwrap())
            );
            showToast(`${seatNumbers.length} seats created successfully!`, 'success');
          }
        } else if (seatNumbers.length === 1) {
          await addSeat({ roomId: parentId, number: seatNumbers[0] }).unwrap();
          showToast('Seat created successfully!', 'success');
        }
      }
      onClose();
    } catch (err: any) {
      showToast(err?.data?.message || 'Creation failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        creatorType === 'room'
          ? 'Add Room'
          : creatorType === 'seat'
          ? 'Add Seats'
          : 'Add Floor'
      }
      maxWidth="sm"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Creator Type Tab Switcher */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#F1F5F9',
            padding: '4px',
            borderRadius: '12px',
            gap: '4px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setCreatorType('floor');
              setCreatorName('');
            }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: creatorType === 'floor' ? '#FFFFFF' : 'transparent',
              color: creatorType === 'floor' ? '#0F172A' : '#64748B',
              fontWeight: creatorType === 'floor' ? 700 : 500,
              fontSize: '0.8rem',
              cursor: 'pointer',
              boxShadow: creatorType === 'floor' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Layers size={14} color={creatorType === 'floor' ? '#2563EB' : '#64748B'} />
            Floor
          </button>

          <button
            type="button"
            onClick={() => {
              setCreatorType('room');
              setCreatorName('');
              if (currentFloor) setParentId(currentFloor.id);
            }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: creatorType === 'room' ? '#FFFFFF' : 'transparent',
              color: creatorType === 'room' ? '#0F172A' : '#64748B',
              fontWeight: creatorType === 'room' ? 700 : 500,
              fontSize: '0.8rem',
              cursor: 'pointer',
              boxShadow: creatorType === 'room' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <DoorOpen size={14} color={creatorType === 'room' ? '#8B5CF6' : '#64748B'} />
            Room
          </button>

          <button
            type="button"
            onClick={() => {
              setCreatorType('seat');
              setCreatorName('');
              if (currentFloor?.rooms && currentFloor.rooms.length > 0) {
                setParentId(currentFloor.rooms[0].id);
              }
            }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: creatorType === 'seat' ? '#FFFFFF' : 'transparent',
              color: creatorType === 'seat' ? '#0F172A' : '#64748B',
              fontWeight: creatorType === 'seat' ? 700 : 500,
              fontSize: '0.8rem',
              cursor: 'pointer',
              boxShadow: creatorType === 'seat' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Armchair size={14} color={creatorType === 'seat' ? '#10B981' : '#64748B'} />
            Seats
          </button>
        </div>

        {creatorType === 'room' &&
          (!seatMap || seatMap.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '16px',
                border: '1px dashed var(--border-card)',
                borderRadius: '12px',
                backgroundColor: '#F8FAFC',
              }}
            >
              <p className="text-muted" style={{ margin: 0, fontSize: '0.8rem' }}>
                No floors exist yet. Create a floor first.
              </p>
              <Button variant="outline" size="sm" onClick={() => setCreatorType('floor')}>
                + Add Floor
              </Button>
            </div>
          ) : (
            <div>
              <label className="custom-input-label">Target Floor</label>
              <Select
                value={parentId}
                onChange={(val) => setParentId(val)}
                placeholder="Select floor"
                options={seatMap.map((f: any) => ({
                  value: f.id,
                  label: f.name,
                }))}
              />
            </div>
          ))}

        {creatorType === 'seat' &&
          (!currentFloor?.rooms || currentFloor.rooms.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '16px',
                border: '1px dashed var(--border-card)',
                borderRadius: '12px',
                backgroundColor: '#F8FAFC',
              }}
            >
              <p className="text-muted" style={{ margin: 0, fontSize: '0.8rem' }}>
                No rooms exist on this floor. Create a room first.
              </p>
              <Button variant="outline" size="sm" onClick={() => setCreatorType('room')}>
                + Add Room
              </Button>
            </div>
          ) : (
            <div>
              <label className="custom-input-label">Target Room</label>
              <Select
                value={parentId}
                onChange={(val) => setParentId(val)}
                placeholder="Select room"
                options={currentFloor.rooms.map((r: any) => ({
                  value: r.id,
                  label: r.name,
                }))}
              />
            </div>
          ))}

        <div>
          <Input
            label={
              creatorType === 'seat'
                ? 'Seat Number or Range'
                : creatorType === 'room'
                ? 'Room Name'
                : 'Floor Name'
            }
            placeholder={
              creatorType === 'seat'
                ? 'e.g. 1-50, A1-A20, or A-1, A-2'
                : creatorType === 'room'
                ? 'e.g. Hall A, Quiet Study Wing'
                : 'e.g. Ground Floor, 1st Floor'
            }
            required
            value={creatorName}
            onChange={(e) => setCreatorName(e.target.value)}
          />

          {creatorType === 'seat' && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>Presets:</span>
                {['1-30', '1-50', 'A1-A20', 'B1-B20', '101-140'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCreatorName(preset)}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      border: '1px solid #E2E8F0',
                      backgroundColor: '#F8FAFC',
                      color: '#2563EB',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {parsedPreview.length > 0 && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    fontSize: '0.75rem',
                    color: '#1E40AF',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Sparkles size={13} color="#2563EB" />
                  <span>
                    Will create <strong>{parsedPreview.length} seat(s)</strong>:{' '}
                    {parsedPreview.slice(0, 8).join(', ')}
                    {parsedPreview.length > 8 && ` ... (+${parsedPreview.length - 8} more)`}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bulk Import Callout */}
        {onOpenImport && (
          <div
            onClick={() => {
              onClose();
              onOpenImport();
            }}
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSpreadsheet size={16} color="#16A34A" />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#166534' }}>
                Need to import multiple rooms or floors from Excel/CSV?
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803D' }}>
              Open Bulk Import &rarr;
            </span>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-card)',
        }}
      >
        <Button variant="text" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          disabled={isSubmitting || !creatorName.trim()}
          variant="primary"
          style={{
            backgroundColor: 'var(--accent-blue)',
            borderColor: 'var(--accent-blue)',
            borderRadius: '12px',
          }}
        >
          {isSubmitting
            ? 'Creating...'
            : creatorType === 'seat' && parsedPreview.length > 1
            ? `Create ${parsedPreview.length} Seats`
            : 'Create'}
        </Button>
      </div>
    </Modal>
  );
};
