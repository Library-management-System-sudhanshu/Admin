import React, { useState, useEffect } from 'react';
import { useAddFloorMutation, useAddRoomMutation, useAddSeatMutation } from '../store/api';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { Input } from './ui/Input';
import { useToast } from './ui/ToastContext';

interface LayoutCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorType: 'floor' | 'room' | 'seat';
  setCreatorType: (type: 'floor' | 'room' | 'seat') => void;
  seatMap: any[] | undefined;
  currentFloor: any;
  selectedBranch: string;
  selectedParentId?: string;
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
}) => {
  const { showToast } = useToast();
  const [addFloor] = useAddFloorMutation();
  const [addRoom] = useAddRoomMutation();
  const [addSeat] = useAddSeatMutation();

  const [creatorName, setCreatorName] = useState('');
  const [parentId, setParentId] = useState('');

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
    try {
      if (creatorType === 'floor') {
        await addFloor({ branchId: selectedBranch, name: creatorName }).unwrap();
        showToast('Floor created successfully!', 'success');
      } else if (creatorType === 'room') {
        if (!parentId) {
          showToast('Please select a floor first', 'error');
          return;
        }
        await addRoom({ floorId: parentId, name: creatorName }).unwrap();
        showToast('Room created successfully!', 'success');
      } else if (creatorType === 'seat') {
        if (!parentId) {
          showToast('Please select a room first', 'error');
          return;
        }
        if (creatorName.includes('-')) {
          const [startStr, endStr] = creatorName.split('-');
          const start = parseInt(startStr.trim(), 10);
          const end = parseInt(endStr.trim(), 10);
          if (!isNaN(start) && !isNaN(end) && start <= end && end - start <= 200) {
            for (let i = start; i <= end; i++) {
              await addSeat({ roomId: parentId, number: i.toString() }).unwrap();
            }
            showToast(`Seats ${start} to ${end} created!`, 'success');
          } else {
            await addSeat({ roomId: parentId, number: creatorName }).unwrap();
            showToast('Seat created!', 'success');
          }
        } else {
          await addSeat({ roomId: parentId, number: creatorName }).unwrap();
          showToast('Seat created!', 'success');
        }
      }
      onClose();
    } catch (err: any) {
      showToast(err.data?.message || 'Creation failed', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={creatorType === 'room' ? 'Add Room' : creatorType === 'seat' ? 'Add Seat' : 'Add Floor'}
      maxWidth="sm"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {creatorType === 'room' && (
          (!seatMap || seatMap.length === 0) ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px', border: '1px dashed var(--border-card)', borderRadius: '12px', backgroundColor: '#F8FAFC' }}>
              <p className="text-muted" style={{ margin: 0, fontSize: '0.8rem' }}>No floors exist yet. Create a floor first.</p>
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
          )
        )}

        {creatorType === 'seat' && (
          (!currentFloor?.rooms || currentFloor.rooms.length === 0) ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px', border: '1px dashed var(--border-card)', borderRadius: '12px', backgroundColor: '#F8FAFC' }}>
              <p className="text-muted" style={{ margin: 0, fontSize: '0.8rem' }}>No rooms exist on this floor. Create a room first.</p>
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
          )
        )}

        <Input
          label={
            creatorType === 'seat'
              ? 'Seat Number (e.g. A-1 or 1-60)'
              : creatorType === 'room'
                ? 'Room Name (e.g. Hall A)'
                : 'Floor Name (e.g. Ground Floor)'
          }
          required
          value={creatorName}
          onChange={(e) => setCreatorName(e.target.value)}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-card)' }}>
        <Button
          variant="text"
          onClick={() => {
            if (creatorType === 'room') {
              setCreatorType('seat');
            } else {
              onClose();
            }
          }}
        >
          {creatorType === 'room' ? 'Proceed to Seat' : 'Cancel'}
        </Button>
        <Button onClick={handleCreate} variant="primary" style={{ backgroundColor: 'var(--accent-blue)', borderColor: 'var(--accent-blue)', borderRadius: '12px' }}>
          Create
        </Button>
      </div>
    </Modal>
  );
};
