const fs = require('fs');

let content = fs.readFileSync('src/pages/Billing.tsx', 'utf8');

// Update shift form data
content = content.replace(
  /const \[shiftFormData, setShiftFormData\] = useState\(\{[\s\S]*?price6Months: '' as any,\n  \}\);/,
  `const [shiftFormData, setShiftFormData] = useState({
    id: '',
    name: '',
    startTime: '09:00',
    endTime: '17:00',
    type: 'BASE' as 'BASE' | 'CLUBBED',
    baseShiftIds: [] as string[],
    capacity: '' as any,
    price: '' as any,
    price7Days: '' as any,
    price15Days: '' as any,
    price3Months: '' as any,
    price6Months: '' as any,
  });`
);

// Update presets
content = content.replace(
  /const PRESET_SHIFTS = \[([\s\S]*?)\];/,
  `const PRESET_SHIFTS = [
  { id: 'morning', label: 'Morning', subText: '8 AM - 2 PM', name: 'Morning Shift', startTime: '08:00', endTime: '14:00', icon: Sun },
  { id: 'afternoon', label: 'Afternoon', subText: '2 PM - 8 PM', name: 'Afternoon Shift', startTime: '14:00', endTime: '20:00', icon: SunMedium },
  { id: 'evening', label: 'Evening', subText: '6 PM - 11 PM', name: 'Evening Shift', startTime: '18:00', endTime: '23:00', icon: Sunset },
  { id: 'night', label: 'Night', subText: '11 PM - 6 AM', name: 'Night Shift', startTime: '23:00', endTime: '06:00', icon: Moon }
];`
);

// Update handleOpenCreateShift
content = content.replace(
  /const handleOpenCreateShift = \(\) => \{[\s\S]*?setOpenShiftModal\(true\);\n  \};/,
  `const handleOpenCreateShift = (type: 'BASE' | 'CLUBBED' = 'BASE') => {
    setEditShiftMode(false);
    setShiftFormData({
      id: '',
      name: '',
      startTime: type === 'BASE' ? '09:00' : '',
      endTime: type === 'BASE' ? '17:00' : '',
      type,
      baseShiftIds: [],
      capacity: '',
      price: '',
      price7Days: '',
      price15Days: '',
      price3Months: '',
      price6Months: '',
    });
    setCustomPricingList([
      { label: '7 Days', price: '' },
      { label: '15 Days', price: '' },
      { label: '1 Month', price: '' },
      { label: '2 Months', price: '' },
      { label: '3 Months', price: '' },
    ]);
    setSelectedPreset('custom');
    setOpenShiftModal(true);
  };`
);

// Update handleOpenEditShift
content = content.replace(
  /const handleOpenEditShift = \(shift: any\) => \{[\s\S]*?setOpenShiftModal\(true\);\n  \};/,
  `const handleOpenEditShift = (shift: any) => {
    setEditShiftMode(true);
    setShiftFormData({
      ...shift,
      type: shift.type || 'BASE',
      baseShiftIds: shift.baseShiftIds || [],
      capacity: shift.capacity ?? '',
      price7Days: shift.price7Days ?? '',
      price15Days: shift.price15Days ?? '',
      price3Months: shift.price3Months ?? '',
      price6Months: shift.price6Months ?? '',
    });

    let initialTiers: { label: string; price: number | string }[] = [];
    if (Array.isArray(shift.customPricing) && shift.customPricing.length > 0) {
      initialTiers = shift.customPricing.map((t: any) => ({ label: t.label, price: t.price }));
    } else {
      if (shift.price7Days) initialTiers.push({ label: '7 Days', price: shift.price7Days });
      if (shift.price15Days) initialTiers.push({ label: '15 Days', price: shift.price15Days });
      if (shift.price) initialTiers.push({ label: '1 Month', price: shift.price });
      if (shift.price3Months) initialTiers.push({ label: '3 Months', price: shift.price3Months });
      if (shift.price6Months) initialTiers.push({ label: '6 Months', price: shift.price6Months });
      if (initialTiers.length === 0) {
        initialTiers = [
          { label: '7 Days', price: '' },
          { label: '15 Days', price: '' },
          { label: '1 Month', price: shift.price || '' },
        ];
      }
    }
    setCustomPricingList(initialTiers);
    const matchedPreset = PRESET_SHIFTS.find(p => p.name === shift.name && p.startTime === shift.startTime && p.endTime === shift.endTime);
    setSelectedPreset(matchedPreset ? matchedPreset.id : 'custom');
    setOpenShiftModal(true);
  };`
);

// Update Tabs
content = content.replace(
  /<Tabs value=\{tab\} onChange=\{\(_, val\) => setTab\(val\)\} className="billing-tabs" variant="scrollable" scrollButtons=\{false\} sx=\{\{ mb: 0, borderBottom: 'none' \}\}>\n\s*<Tab label="Collection ledger" \/>\n\s*<Tab label="Shifts & pricing" \/>\n\s*<\/Tabs>/,
  `<Tabs value={tab} onChange={(_, val) => setTab(val)} className="billing-tabs" variant="scrollable" scrollButtons={false} sx={{ mb: 0, borderBottom: 'none' }}>
          <Tab label="Collection ledger" />
          <Tab label="Base Shifts" />
          <Tab label="Clubbed Packages" />
        </Tabs>`
);

// Update the rendering of tab 1 and 2
const oldTab1 = `{tab === 1 && (
        <Card sx={{ p: 3, border: '1px solid #E2E8F0', boxShadow: 'none', borderRadius: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Shift Plans & Pricing Cards</Typography>
            <Button
              variant="primary"
              onClick={handleOpenCreateShift}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--accent-blue)', borderColor: 'var(--accent-blue)', borderRadius: '10px' }}
            >
              <Plus size={16} /> Create New Shift
            </Button>
          </Box>`;

const newTab1 = `{(tab === 1 || tab === 2) && (
        <Card sx={{ p: 3, border: '1px solid #E2E8F0', boxShadow: 'none', borderRadius: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {tab === 1 ? 'Base Shifts & Timings' : 'Clubbed / Full-Day Packages'}
            </Typography>
            <Button
              variant="primary"
              onClick={() => handleOpenCreateShift(tab === 1 ? 'BASE' : 'CLUBBED')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--accent-blue)', borderColor: 'var(--accent-blue)', borderRadius: '10px' }}
            >
              <Plus size={16} /> Create New {tab === 1 ? 'Base Shift' : 'Package'}
            </Button>
          </Box>`;

content = content.replace(oldTab1, newTab1);

// Update map of shifts to filter by type
const oldShiftsMap = `{shifts.map((shift: any) => {`;
const newShiftsMap = `{shifts.filter((s: any) => tab === 1 ? (s.type === 'BASE' || !s.type) : s.type === 'CLUBBED').map((shift: any) => {`;
content = content.replace(oldShiftsMap, newShiftsMap);

// Update modal header text
const oldModalHeader = `<Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {editShiftMode ? 'Edit Shift Settings' : 'Create New Shift Plan'}
              </Typography>`;
const newModalHeader = `<Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {editShiftMode ? 'Edit Shift Settings' : (shiftFormData.type === 'CLUBBED' ? 'Create New Clubbed Package' : 'Create New Base Shift')}
              </Typography>`;
content = content.replace(oldModalHeader, newModalHeader);

// Update quick presets rendering to hide if CLUBBED
const oldQuickPresets = `{/* Quick Presets Selection */}
            <Box>`;
const newQuickPresets = `{/* Quick Presets Selection */}
            {shiftFormData.type === 'BASE' && <Box>`;
content = content.replace(oldQuickPresets, newQuickPresets);

const oldQuickPresetsEnd = `</Box>
              </Box>
            </Box>

            {/* Shift Name */}`;
const newQuickPresetsEnd = `</Box>
              </Box>
            </Box>}

            {/* Shift Name */}`;
content = content.replace(oldQuickPresetsEnd, newQuickPresetsEnd);

fs.writeFileSync('src/pages/Billing.tsx', content);
