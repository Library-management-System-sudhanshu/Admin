import {
  useDeleteSeatMutation,
  useUpdateSeatStatusMutation,
  useVacateSeatMutation,
  useUpdateAllocationMutation,
} from '../../../store/api';
import { useToast } from '../../../components/ui/ToastContext';
import { getErrorMessage } from '../../../utils/errorUtils';

export function useSeatActions() {
  const { showToast } = useToast();
  const [deleteSeatMutation, { isLoading: isDeletingSeat }] = useDeleteSeatMutation();
  const [updateSeatStatusMutation, { isLoading: isUpdatingStatus }] = useUpdateSeatStatusMutation();
  const [vacateSeatMutation, { isLoading: isVacating }] = useVacateSeatMutation();
  const [updateAllocationMutation, { isLoading: isUpdatingAllocation }] = useUpdateAllocationMutation();

  const deleteSeat = async (seatId: string, onSuccess?: () => void) => {
    if (!window.confirm('Are you sure you want to delete this seat?')) return;
    try {
      await deleteSeatMutation(seatId).unwrap();
      showToast('Seat deleted successfully!', 'success');
      onSuccess?.();
    } catch (err: any) {
      showToast(getErrorMessage(err, 'Failed to delete seat'), 'error');
    }
  };

  const updateSeatStatus = async (
    seatId: string,
    status: 'AVAILABLE' | 'BLOCKED',
    onSuccess?: () => void
  ) => {
    try {
      await updateSeatStatusMutation({ id: seatId, status }).unwrap();
      showToast(
        status === 'BLOCKED' ? 'Seat marked under maintenance!' : 'Seat is now available!',
        'success'
      );
      onSuccess?.();
    } catch (err: any) {
      showToast(getErrorMessage(err, 'Failed to update seat status'), 'error');
    }
  };

  const vacateSeat = async (seatId: string, onSuccess?: () => void) => {
    if (!window.confirm('Are you sure you want to vacate this seat pod?')) return;
    try {
      await vacateSeatMutation(seatId).unwrap();
      showToast('Seat successfully vacated!', 'success');
      onSuccess?.();
    } catch (err: any) {
      showToast(getErrorMessage(err, 'Failed to vacate seat'), 'error');
    }
  };

  const updateAllocationDates = async (
    allocationId: string,
    startDate: string,
    endDate: string,
    onSuccess?: () => void
  ) => {
    try {
      await updateAllocationMutation({
        id: allocationId,
        startDate,
        endDate,
      }).unwrap();
      showToast('Subscription dates updated successfully!', 'success');
      onSuccess?.();
    } catch (err: any) {
      showToast(getErrorMessage(err, 'Failed to update dates'), 'error');
    }
  };

  return {
    deleteSeat,
    isDeletingSeat,
    updateSeatStatus,
    isUpdatingStatus,
    vacateSeat,
    isVacating,
    updateAllocationDates,
    isUpdatingAllocation,
  };
}
