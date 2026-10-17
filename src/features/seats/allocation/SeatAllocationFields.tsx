import { StudentPicker } from './StudentPicker';
import type { StudentPickerProps } from './StudentPicker';
import { ShiftPicker } from './ShiftPicker';
import type { ShiftPickerProps } from './ShiftPicker';
import { BookingDatesFields } from './BookingDatesFields';
import type { BookingDatesFieldsProps } from './BookingDatesFields';
import { InvoiceFields } from './InvoiceFields';
import type { InvoiceFieldsProps } from './InvoiceFields';

export interface SeatAllocationFieldsProps {
  studentPickerProps: StudentPickerProps;
  shiftPickerProps: ShiftPickerProps;
  datesProps: BookingDatesFieldsProps;
  invoiceProps: InvoiceFieldsProps;
}

export const SeatAllocationFields: React.FC<SeatAllocationFieldsProps> = ({
  studentPickerProps,
  shiftPickerProps,
  datesProps,
  invoiceProps,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <StudentPicker {...studentPickerProps} />
      <ShiftPicker {...shiftPickerProps} />
      <BookingDatesFields {...datesProps} />
      <InvoiceFields {...invoiceProps} />
    </div>
  );
};
