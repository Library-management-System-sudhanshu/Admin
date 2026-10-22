import React, { useState, useMemo, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Layers,
  DoorOpen,
  Armchair,
  Sparkles,
  ArrowRight,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Info
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { useToast } from '../../../components/ui/ToastContext';
import {
  useAddFloorMutation,
  useAddRoomMutation,
  useAddBulkSeatsMutation,
  useAddSeatMutation
} from '../../../store/api';
import type { Floor } from '../types';

export interface ParsedImportItem {
  id: string;
  floorName: string;
  roomName: string;
  seats: string[];
  rawSeatExpr: string;
}

export interface SeatImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  seatMap?: Floor[] | null;
  selectedBranch: string;
  initialFloorId?: string;
  initialRoomId?: string;
  onSuccess?: (targetFloorId?: string) => void;
}

// Expands seat expressions like "1-50", "A1-A20", "Row A: 1-10", or "A1, A2, A3"
export function parseSeatExpression(expr: string): string[] {
  const trimmed = expr.trim();
  if (!trimmed) return [];

  // Comma or semicolon separated list
  if (trimmed.includes(',') || trimmed.includes(';')) {
    const list = trimmed.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
    const result: string[] = [];
    for (const item of list) {
      if (item.includes('-')) {
        result.push(...parseSeatExpression(item));
      } else {
        result.push(item);
      }
    }
    return Array.from(new Set(result));
  }

  // Range syntax like A1-A20 or 1-50
  if (trimmed.includes('-')) {
    const parts = trimmed.split('-');
    if (parts.length === 2) {
      const startStr = parts[0].trim();
      const endStr = parts[1].trim();

      const startMatch = startStr.match(/^([A-Za-z\s_-]*?)(\d+)$/);
      const endMatch = endStr.match(/^([A-Za-z\s_-]*?)(\d+)$/);

      if (startMatch && endMatch) {
        const prefix = startMatch[1] || endMatch[1] || '';
        const start = parseInt(startMatch[2], 10);
        const end = parseInt(endMatch[2], 10);

        if (!isNaN(start) && !isNaN(end) && start <= end && end - start <= 400) {
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
}

// Parse text lines or CSV contents
export function parseCsvOrText(rawText: string): ParsedImportItem[] {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const items: ParsedImportItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect separator: Tab, Comma, or Pipe
    let parts: string[] = [];
    if (line.includes('\t')) {
      parts = line.split('\t').map((p) => p.trim());
    } else if (line.includes('|')) {
      parts = line.split('|').map((p) => p.trim());
    } else {
      // Split by comma ignoring commas inside quotes
      parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((p) => p.replace(/^"|"$/g, '').trim());
    }

    if (parts.length < 3) continue;

    const floorName = parts[0];
    const roomName = parts[1];
    const seatExpr = parts.slice(2).join(',').trim();

    // Skip header row if present
    if (
      i === 0 &&
      floorName.toLowerCase().includes('floor') &&
      roomName.toLowerCase().includes('room')
    ) {
      continue;
    }

    if (!floorName || !roomName || !seatExpr) continue;

    const seats = parseSeatExpression(seatExpr);
    if (seats.length > 0) {
      items.push({
        id: `${floorName}-${roomName}-${i}`,
        floorName,
        roomName,
        seats,
        rawSeatExpr: seatExpr,
      });
    }
  }

  // Merge items that have identical Floor and Room
  const mergedMap: Record<string, ParsedImportItem> = {};
  for (const item of items) {
    const key = `${item.floorName.toLowerCase()}:::${item.roomName.toLowerCase()}`;
    if (!mergedMap[key]) {
      mergedMap[key] = {
        id: key,
        floorName: item.floorName,
        roomName: item.roomName,
        seats: [...item.seats],
        rawSeatExpr: item.rawSeatExpr,
      };
    } else {
      const combinedSeats = Array.from(new Set([...mergedMap[key].seats, ...item.seats]));
      mergedMap[key].seats = combinedSeats;
      mergedMap[key].rawSeatExpr += `, ${item.rawSeatExpr}`;
    }
  }

  return Object.values(mergedMap);
}

export const SeatImportModal: React.FC<SeatImportModalProps> = ({
  isOpen,
  onClose,
  seatMap = [],
  selectedBranch,
  initialFloorId,
  initialRoomId,
  onSuccess,
}) => {
  const { showToast } = useToast();

  const [addFloor] = useAddFloorMutation();
  const [addRoom] = useAddRoomMutation();
  const [addBulkSeats] = useAddBulkSeatsMutation();
  const [addSeat] = useAddSeatMutation();

  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'generator'>('upload');

  // File upload state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string>('');

  // Paste text state
  const [pasteContent, setPasteContent] = useState<string>(
    'Ground Floor, Main Hall, 1-30\nGround Floor, Quiet Study, A1-A20\n1st Floor, Executive Wing, 101-140'
  );

  // Parsed items list
  const [parsedItems, setParsedItems] = useState<ParsedImportItem[]>([]);

  // Generator form state
  const [genFloorMode, setGenFloorMode] = useState<'existing' | 'new'>(
    seatMap && seatMap.length > 0 ? 'existing' : 'new'
  );
  const [genSelectedFloorId, setGenSelectedFloorId] = useState<string>(
    initialFloorId || (seatMap && seatMap[0]?.id) || ''
  );
  const [genNewFloorName, setGenNewFloorName] = useState<string>('');

  const [genRoomMode, setGenRoomMode] = useState<'existing' | 'new'>('new');
  const [genSelectedRoomId, setGenSelectedRoomId] = useState<string>(initialRoomId || '');
  const [genNewRoomName, setGenNewRoomName] = useState<string>('Reading Hall A');

  const [genPattern, setGenPattern] = useState<'range' | 'alpha' | 'list'>('alpha');
  const [genAlphaRows, setGenAlphaRows] = useState<string>('A, B, C');
  const [genAlphaCount, setGenAlphaCount] = useState<number>(15);
  const [genRangeStart, setGenRangeStart] = useState<number>(1);
  const [genRangeEnd, setGenRangeEnd] = useState<number>(40);
  const [genRangePrefix, setGenRangePrefix] = useState<string>('');
  const [genCustomList, setGenCustomList] = useState<string>('1, 2, 3, 4, 5, 6, 7, 8, 9, 10');

  // Execution & Progress state
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);

  // Reset or initialize on open
  React.useEffect(() => {
    if (isOpen) {
      setIsImporting(false);
      setProgressMsg('');
      setProgressPercent(0);

      if (initialFloorId) {
        setGenSelectedFloorId(initialFloorId);
        setGenFloorMode('existing');
      } else if (seatMap && seatMap.length > 0) {
        setGenSelectedFloorId(seatMap[0].id);
        setGenFloorMode('existing');
      } else {
        setGenFloorMode('new');
      }

      if (initialRoomId) {
        setGenSelectedRoomId(initialRoomId);
        setGenRoomMode('existing');
      }

      // Initial parse for pasteContent
      const initialParsed = parseCsvOrText(pasteContent);
      setParsedItems(initialParsed);
    }
  }, [isOpen, initialFloorId, initialRoomId, seatMap]);

  // Handle file change
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const parsed = parseCsvOrText(content);
        if (parsed.length === 0) {
          showToast('No valid rows found in file. Ensure format is: Floor, Room, Seats', 'error');
        } else {
          setParsedItems(parsed);
          setPasteContent(content);
          showToast(`Parsed ${parsed.length} room layouts successfully!`, 'success');
        }
      }
    };
    reader.readAsText(file);
  };

  // Download Sample Template CSV
  const handleDownloadTemplate = () => {
    const csvContent =
      'Floor,Room,Seats\n' +
      'Ground Floor,Main Study Hall,1-30\n' +
      'Ground Floor,Quiet Room,A1-A20\n' +
      '1st Floor,Executive Hall,101-140\n' +
      '1st Floor,Discussion Wing,B1-B15\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Seat_Layout_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded sample template!', 'info');
  };

  // Compute generated seats in generator tab
  const generatedSeatsList = useMemo(() => {
    if (genPattern === 'alpha') {
      const rows = genAlphaRows
        .split(/[,;\s]+/)
        .map((r) => r.trim().toUpperCase())
        .filter(Boolean);
      const list: string[] = [];
      const count = Math.min(Math.max(1, genAlphaCount || 10), 100);
      for (const row of rows) {
        for (let i = 1; i <= count; i++) {
          list.push(`${row}${i}`);
        }
      }
      return list;
    } else if (genPattern === 'range') {
      const start = Math.max(1, genRangeStart || 1);
      const end = Math.min(Math.max(start, genRangeEnd || 30), start + 300);
      const list: string[] = [];
      for (let i = start; i <= end; i++) {
        list.push(`${genRangePrefix}${i}`);
      }
      return list;
    } else {
      return parseSeatExpression(genCustomList);
    }
  }, [
    genPattern,
    genAlphaRows,
    genAlphaCount,
    genRangeStart,
    genRangeEnd,
    genRangePrefix,
    genCustomList,
  ]);

  // Total stats from parsed items
  const stats = useMemo(() => {
    if (activeTab === 'generator') {
      return {
        floorsCount: 1,
        roomsCount: 1,
        seatsCount: generatedSeatsList.length,
      };
    }
    const uniqueFloors = new Set(parsedItems.map((i) => i.floorName.toLowerCase().trim()));
    const totalSeats = parsedItems.reduce((acc, i) => acc + i.seats.length, 0);
    return {
      floorsCount: uniqueFloors.size,
      roomsCount: parsedItems.length,
      seatsCount: totalSeats,
    };
  }, [activeTab, parsedItems, generatedSeatsList]);

  // Execute import process
  const handleExecuteImport = async () => {
    if (!selectedBranch) {
      showToast('No branch selected', 'error');
      return;
    }

    setIsImporting(true);
    setProgressPercent(5);
    setProgressMsg('Initializing workspace layout...');

    try {
      let itemsToImport: ParsedImportItem[] = [];

      if (activeTab === 'generator') {
        const floorName =
          genFloorMode === 'existing'
            ? seatMap?.find((f) => f.id === genSelectedFloorId)?.name || 'Ground Floor'
            : genNewFloorName.trim() || 'Ground Floor';

        let roomName = '';
        if (genRoomMode === 'existing') {
          const currentFloorObj = seatMap?.find((f) => f.id === genSelectedFloorId);
          roomName =
            currentFloorObj?.rooms?.find((r) => r.id === genSelectedRoomId)?.name || 'Room 1';
        } else {
          roomName = genNewRoomName.trim() || 'Hall A';
        }

        if (generatedSeatsList.length === 0) {
          showToast('No seats to generate. Check configuration.', 'error');
          setIsImporting(false);
          return;
        }

        itemsToImport = [
          {
            id: 'gen-1',
            floorName,
            roomName,
            seats: generatedSeatsList,
            rawSeatExpr: `${generatedSeatsList.length} generated seats`,
          },
        ];
      } else {
        itemsToImport = parsedItems;
      }

      if (itemsToImport.length === 0) {
        showToast('Please add or parse layout items before importing', 'warning');
        setIsImporting(false);
        return;
      }

      // Track floor map by normalized name to floorId
      const floorIdMap = new Map<string, string>();
      // Pre-fill existing floors from seatMap
      (seatMap || []).forEach((f) => {
        floorIdMap.set(f.name.toLowerCase().trim(), f.id);
      });

      // Track room map by "floorId:::roomName" to roomId
      const roomIdMap = new Map<string, string>();
      (seatMap || []).forEach((f) => {
        (f.rooms || []).forEach((r) => {
          roomIdMap.set(`${f.id}:::${r.name.toLowerCase().trim()}`, r.id);
        });
      });

      const totalOperations = itemsToImport.length * 3;
      let completedOps = 0;
      let createdFloorCount = 0;
      let createdRoomCount = 0;
      let createdSeatCount = 0;
      let firstFloorIdCreatedOrUsed = '';

      // Step 1: Ensure all Floors exist
      for (const item of itemsToImport) {
        const normalizedFloor = item.floorName.toLowerCase().trim();
        let targetFloorId = floorIdMap.get(normalizedFloor);

        if (!targetFloorId) {
          setProgressMsg(`Creating Floor: "${item.floorName}"...`);
          const res: any = await addFloor({
            branchId: selectedBranch,
            name: item.floorName.trim(),
          }).unwrap();

          targetFloorId = res?.id || res?.data?.id || res?.floor?.id;
          if (targetFloorId) {
            floorIdMap.set(normalizedFloor, targetFloorId);
            createdFloorCount++;
          }
        }

        if (targetFloorId && !firstFloorIdCreatedOrUsed) {
          firstFloorIdCreatedOrUsed = targetFloorId;
        }

        completedOps++;
        setProgressPercent(Math.round((completedOps / totalOperations) * 100));
      }

      // Step 2 & 3: Ensure all Rooms exist and Add Seats
      for (const item of itemsToImport) {
        const targetFloorId = floorIdMap.get(item.floorName.toLowerCase().trim());
        if (!targetFloorId) continue;

        const roomKey = `${targetFloorId}:::${item.roomName.toLowerCase().trim()}`;
        let targetRoomId = roomIdMap.get(roomKey);

        if (!targetRoomId) {
          setProgressMsg(`Creating Room: "${item.roomName}" on ${item.floorName}...`);
          const res: any = await addRoom({
            floorId: targetFloorId,
            name: item.roomName.trim(),
          }).unwrap();

          targetRoomId = res?.id || res?.data?.id || res?.room?.id;
          if (targetRoomId) {
            roomIdMap.set(roomKey, targetRoomId);
            createdRoomCount++;
          }
        }

        completedOps++;
        setProgressPercent(Math.round((completedOps / totalOperations) * 100));

        // Add seats to room
        if (targetRoomId && item.seats.length > 0) {
          setProgressMsg(
            `Adding ${item.seats.length} seats to "${item.roomName}" (${item.floorName})...`
          );

          try {
            await addBulkSeats({
              roomId: targetRoomId,
              numbers: item.seats,
            }).unwrap();
            createdSeatCount += item.seats.length;
          } catch (bulkErr) {
            // Fallback: batch parallel creation
            const batchSize = 15;
            for (let b = 0; b < item.seats.length; b += batchSize) {
              const chunk = item.seats.slice(b, b + batchSize);
              await Promise.all(
                chunk.map((num) => addSeat({ roomId: targetRoomId!, number: num }).unwrap())
              );
            }
            createdSeatCount += item.seats.length;
          }
        }

        completedOps++;
        setProgressPercent(Math.round((completedOps / totalOperations) * 100));
      }

      setProgressPercent(100);
      setProgressMsg('Import completed successfully!');

      showToast(
        `Import Complete! Added ${createdSeatCount} seats across ${createdRoomCount || itemsToImport.length} room(s).`,
        'success'
      );

      if (onSuccess) {
        onSuccess(firstFloorIdCreatedOrUsed);
      }
      onClose();
    } catch (err: any) {
      showToast(err?.data?.message || err?.message || 'Import failed. Please check format.', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isImporting) onClose();
      }}
      title="Floor, Room & Seat Import"
      maxWidth="lg"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Subtitle & Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569' }}>
              Import and auto-generate comprehensive floor levels, study halls, and seat layouts in bulk.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              color: '#2563eb',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-soft)',
              transition: 'all 0.15s ease',
            }}
          >
            <Download size={14} /> Download Sample CSV
          </button>
        </div>

        {/* Tab Switcher */}
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
            onClick={() => setActiveTab('upload')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '9px',
              border: 'none',
              backgroundColor: activeTab === 'upload' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'upload' ? '#0F172A' : '#64748B',
              fontWeight: activeTab === 'upload' ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'upload' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <UploadCloud size={16} color={activeTab === 'upload' ? '#2563EB' : '#64748B'} />
            Upload CSV / Excel
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '9px',
              border: 'none',
              backgroundColor: activeTab === 'paste' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'paste' ? '#0F172A' : '#64748B',
              fontWeight: activeTab === 'paste' ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'paste' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Copy size={16} color={activeTab === 'paste' ? '#2563EB' : '#64748B'} />
            Paste Spreadsheet / Text
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('generator')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '9px',
              border: 'none',
              backgroundColor: activeTab === 'generator' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'generator' ? '#0F172A' : '#64748B',
              fontWeight: activeTab === 'generator' ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'generator' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Sparkles size={16} color={activeTab === 'generator' ? '#8B5CF6' : '#64748B'} />
            Rapid Space Builder
          </button>
        </div>

        {/* TAB 1: CSV FILE UPLOAD */}
        {activeTab === 'upload' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #CBD5E1',
                borderRadius: '16px',
                padding: '36px 20px',
                textAlign: 'center',
                backgroundColor: '#F8FAFC',
                cursor: 'pointer',
                transition: 'border-color 0.2s, background-color 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = '#2563EB';
                e.currentTarget.style.backgroundColor = '#EFF6FF';
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = '#CBD5E1';
                e.currentTarget.style.backgroundColor = '#F8FAFC';
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = '#CBD5E1';
                e.currentTarget.style.backgroundColor = '#F8FAFC';
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  setFileName(file.name);
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const content = ev.target?.result as string;
                    if (content) {
                      const parsed = parseCsvOrText(content);
                      setParsedItems(parsed);
                      setPasteContent(content);
                    }
                  };
                  reader.readAsText(file);
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.tsv"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(37, 99, 235, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563EB',
                }}
              >
                <FileSpreadsheet size={26} />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#1E293B' }}>
                  {fileName ? `Selected: ${fileName}` : 'Drag & drop your CSV or text file here'}
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                  Supports format: <code style={{ backgroundColor: '#EEF2F6', padding: '2px 6px', borderRadius: '4px' }}>Floor, Room, Seats</code> (e.g. 1-50 or A1-A20)
                </p>
              </div>
              <Button size="sm" variant="outline" style={{ marginTop: '6px', borderRadius: '10px' }}>
                Browse File
              </Button>
            </div>
          </div>
        )}

        {/* TAB 2: PASTE SPREADSHEET / TEXT */}
        {activeTab === 'paste' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 600, color: '#1E293B' }}>
                Enter or Paste Lines (Floor, Room, Seats):
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const example =
                      'Ground Floor, Main Hall, 1-30\n' +
                      'Ground Floor, Study Section, A1-A20\n' +
                      '1st Floor, Executive Zone, 101-140';
                    setPasteContent(example);
                    setParsedItems(parseCsvOrText(example));
                  }}
                  style={{
                    border: 'none',
                    background: 'none',
                    color: '#2563EB',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Load 2-Floor Example
                </button>
              </div>
            </div>

            <textarea
              rows={6}
              value={pasteContent}
              onChange={(e) => {
                setPasteContent(e.target.value);
                setParsedItems(parseCsvOrText(e.target.value));
              }}
              placeholder={`Floor, Room, Seat Pattern\nExample:\nGround Floor, Hall A, 1-40\nGround Floor, Hall B, B1-B20\n1st Floor, Room 101, 101-150`}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1.5px solid #CBD5E1',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                outline: 'none',
                resize: 'vertical',
                backgroundColor: '#FFFFFF',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
              }}
            />
          </div>
        )}

        {/* TAB 3: RAPID SPACE GENERATOR */}
        {activeTab === 'generator' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Step 1: Floor Target */}
            <div
              style={{
                background: '#F8FAFC',
                padding: '16px',
                borderRadius: '14px',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={16} color="#2563EB" /> 1. Target Floor
                </span>
                {seatMap && seatMap.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setGenFloorMode('existing')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: genFloorMode === 'existing' ? '#2563EB' : '#CBD5E1',
                        backgroundColor: genFloorMode === 'existing' ? '#EFF6FF' : '#FFFFFF',
                        color: genFloorMode === 'existing' ? '#2563EB' : '#64748B',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Existing Floor
                    </button>
                    <button
                      type="button"
                      onClick={() => setGenFloorMode('new')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: genFloorMode === 'new' ? '#2563EB' : '#CBD5E1',
                        backgroundColor: genFloorMode === 'new' ? '#EFF6FF' : '#FFFFFF',
                        color: genFloorMode === 'new' ? '#2563EB' : '#64748B',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      + Create New Floor
                    </button>
                  </div>
                )}
              </div>

              {genFloorMode === 'existing' && seatMap && seatMap.length > 0 ? (
                <Select
                  value={genSelectedFloorId}
                  onChange={(val) => {
                    setGenSelectedFloorId(val);
                    setGenSelectedRoomId('');
                  }}
                  options={seatMap.map((f) => ({
                    value: f.id,
                    label: `${f.name} (${f.rooms?.length || 0} rooms)`,
                  }))}
                />
              ) : (
                <Input
                  label="New Floor Name"
                  placeholder="e.g. Ground Floor, 1st Floor, Mezzanine"
                  value={genNewFloorName}
                  onChange={(e) => setGenNewFloorName(e.target.value)}
                  required
                />
              )}
            </div>

            {/* Step 2: Room Target */}
            <div
              style={{
                background: '#F8FAFC',
                padding: '16px',
                borderRadius: '14px',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <DoorOpen size={16} color="#8B5CF6" /> 2. Target Room
                </span>
                {genFloorMode === 'existing' &&
                  seatMap?.find((f) => f.id === genSelectedFloorId)?.rooms &&
                  (seatMap.find((f) => f.id === genSelectedFloorId)?.rooms?.length || 0) > 0 && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setGenRoomMode('existing')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid',
                          borderColor: genRoomMode === 'existing' ? '#8B5CF6' : '#CBD5E1',
                          backgroundColor: genRoomMode === 'existing' ? '#F5F3FF' : '#FFFFFF',
                          color: genRoomMode === 'existing' ? '#8B5CF6' : '#64748B',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Existing Room
                      </button>
                      <button
                        type="button"
                        onClick={() => setGenRoomMode('new')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid',
                          borderColor: genRoomMode === 'new' ? '#8B5CF6' : '#CBD5E1',
                          backgroundColor: genRoomMode === 'new' ? '#F5F3FF' : '#FFFFFF',
                          color: genRoomMode === 'new' ? '#8B5CF6' : '#64748B',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        + Create New Room
                      </button>
                    </div>
                  )}
              </div>

              {genRoomMode === 'existing' && genFloorMode === 'existing' ? (
                <Select
                  value={genSelectedRoomId}
                  onChange={(val) => setGenSelectedRoomId(val)}
                  placeholder="Select room"
                  options={
                    seatMap
                      ?.find((f) => f.id === genSelectedFloorId)
                      ?.rooms?.map((r) => ({
                        value: r.id,
                        label: `${r.name} (${r.seats?.length || 0} seats)`,
                      })) || []
                  }
                />
              ) : (
                <Input
                  label="New Room / Hall Name"
                  placeholder="e.g. Main Hall, Quiet Study Section, Room 101"
                  value={genNewRoomName}
                  onChange={(e) => setGenNewRoomName(e.target.value)}
                  required
                />
              )}
            </div>

            {/* Step 3: Seat Pattern Generator */}
            <div
              style={{
                background: '#F8FAFC',
                padding: '16px',
                borderRadius: '14px',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Armchair size={16} color="#10B981" /> 3. Seat Generation Pattern
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setGenPattern('alpha')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: genPattern === 'alpha' ? '#10B981' : '#CBD5E1',
                      backgroundColor: genPattern === 'alpha' ? '#ECFDF5' : '#FFFFFF',
                      color: genPattern === 'alpha' ? '#047857' : '#64748B',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Row Letters (A, B, C)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenPattern('range')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: genPattern === 'range' ? '#10B981' : '#CBD5E1',
                      backgroundColor: genPattern === 'range' ? '#ECFDF5' : '#FFFFFF',
                      color: genPattern === 'range' ? '#047857' : '#64748B',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Numeric Range (1-50)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenPattern('list')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: genPattern === 'list' ? '#10B981' : '#CBD5E1',
                      backgroundColor: genPattern === 'list' ? '#ECFDF5' : '#FFFFFF',
                      color: genPattern === 'list' ? '#047857' : '#64748B',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Custom List
                  </button>
                </div>
              </div>

              {genPattern === 'alpha' && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <Input
                    label="Row Letters (comma-separated)"
                    value={genAlphaRows}
                    onChange={(e) => setGenAlphaRows(e.target.value)}
                    placeholder="e.g. A, B, C, D"
                  />
                  <Input
                    label="Seats Per Row"
                    type="number"
                    min={1}
                    max={100}
                    value={genAlphaCount}
                    onChange={(e) => setGenAlphaCount(parseInt(e.target.value, 10) || 1)}
                  />
                </div>
              )}

              {genPattern === 'range' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <Input
                    label="Prefix (optional)"
                    value={genRangePrefix}
                    onChange={(e) => setGenRangePrefix(e.target.value)}
                    placeholder="e.g. S- or Desk "
                  />
                  <Input
                    label="Start Number"
                    type="number"
                    min={1}
                    value={genRangeStart}
                    onChange={(e) => setGenRangeStart(parseInt(e.target.value, 10) || 1)}
                  />
                  <Input
                    label="End Number"
                    type="number"
                    min={1}
                    value={genRangeEnd}
                    onChange={(e) => setGenRangeEnd(parseInt(e.target.value, 10) || 1)}
                  />
                </div>
              )}

              {genPattern === 'list' && (
                <Input
                  label="Seats List (comma separated)"
                  value={genCustomList}
                  onChange={(e) => setGenCustomList(e.target.value)}
                  placeholder="e.g. 101, 102, 103, VIP-1, VIP-2"
                />
              )}

              {/* Chips preview of seats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>
                  Generated Seat Preview ({generatedSeatsList.length} total):
                </span>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    maxHeight: '100px',
                    overflowY: 'auto',
                    padding: '8px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  {generatedSeatsList.slice(0, 30).map((num, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        color: '#1D4ED8',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {num}
                    </span>
                  ))}
                  {generatedSeatsList.length > 30 && (
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#F1F5F9',
                        color: '#64748B',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      +{generatedSeatsList.length - 30} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PREVIEW SUMMARY TABLE (For Upload and Paste tabs) */}
        {activeTab !== 'generator' && parsedItems.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B' }}>
                Detected Hierarchy Preview ({parsedItems.length} room layouts):
              </span>
              <button
                type="button"
                onClick={() => setParsedItems([])}
                style={{
                  border: 'none',
                  background: 'none',
                  color: '#EF4444',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Trash2 size={13} /> Clear List
              </button>
            </div>

            <div
              style={{
                maxHeight: '180px',
                overflowY: 'auto',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                backgroundColor: '#FFFFFF',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Floor</th>
                    <th style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Room</th>
                    <th style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Seats Count</th>
                    <th style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Sample Numbers</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedItems.map((item, idx) => {
                    const floorExists = seatMap?.some(
                      (f) => f.name.toLowerCase().trim() === item.floorName.toLowerCase().trim()
                    );
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0F172A' }}>
                          {item.floorName}{' '}
                          <span
                            style={{
                              fontSize: '0.65rem',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              backgroundColor: floorExists ? '#F1F5F9' : '#ECFDF5',
                              color: floorExists ? '#64748B' : '#047857',
                              fontWeight: 600,
                            }}
                          >
                            {floorExists ? 'Existing' : 'New'}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', color: '#334155' }}>{item.roomName}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: '#2563EB' }}>
                          {item.seats.length} seats
                        </td>
                        <td style={{ padding: '8px 12px', color: '#64748B', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.seats.slice(0, 6).join(', ')}
                          {item.seats.length > 6 && ` ... (+${item.seats.length - 6})`}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setParsedItems(parsedItems.filter((_, i) => i !== idx));
                            }}
                            style={{
                              border: 'none',
                              background: 'none',
                              color: '#94A3B8',
                              cursor: 'pointer',
                              padding: '2px',
                            }}
                            title="Remove Row"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STATS BADGE BAR */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderRadius: '12px',
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '0.8rem', color: '#475569' }}>
              Target Floors:{' '}
              <strong style={{ color: '#0F172A', fontWeight: 700 }}>{stats.floorsCount}</strong>
            </span>
            <span style={{ fontSize: '0.8rem', color: '#475569' }}>
              Target Rooms:{' '}
              <strong style={{ color: '#0F172A', fontWeight: 700 }}>{stats.roomsCount}</strong>
            </span>
            <span style={{ fontSize: '0.8rem', color: '#475569' }}>
              Total Seats to Add:{' '}
              <strong style={{ color: '#2563EB', fontWeight: 700 }}>{stats.seatsCount}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontSize: '0.75rem', fontWeight: 600 }}>
            <CheckCircle2 size={14} /> Ready for Import
          </div>
        </div>

        {/* PROGRESS BAR WHEN IMPORTING */}
        {isImporting && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw size={14} className="spin-animation" /> {progressMsg || 'Processing import...'}
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E40AF' }}>
                {progressPercent}%
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '4px',
                backgroundColor: '#DBEAFE',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progressPercent}%`,
                  backgroundColor: '#2563EB',
                  transition: 'width 0.25s ease',
                }}
              />
            </div>
          </div>
        )}

        {/* MODAL FOOTER */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            paddingTop: '16px',
            borderTop: '1px solid #E2E8F0',
          }}
        >
          <Button
            variant="text"
            disabled={isImporting}
            onClick={onClose}
            style={{ borderRadius: '10px' }}
          >
            Cancel
          </Button>

          <Button
            onClick={handleExecuteImport}
            disabled={isImporting || stats.seatsCount === 0}
            variant="primary"
            style={{
              borderRadius: '12px',
              backgroundColor: '#2563EB',
              borderColor: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 24px',
              fontWeight: 700,
            }}
          >
            {isImporting ? (
              'Importing...'
            ) : (
              <>
                Import & Create {stats.seatsCount} Seats <ArrowRight size={16} />
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
