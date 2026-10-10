import re

file_path = '/Users/sudhanshukumar/Desktop/Backend-code/src/services/seat.service.ts'
with open(file_path, 'r') as f:
    content = f.read()

# Make sure Shift is imported
if 'import { Seat, Room, Floor, Branch, SeatAllocation, SeatStatus, StudentProfile, StudentSubscription, SubscriptionStatus }' in content:
    content = content.replace(
        'import { Seat, Room, Floor, Branch, SeatAllocation, SeatStatus, StudentProfile, StudentSubscription, SubscriptionStatus }',
        'import { Seat, Room, Floor, Branch, SeatAllocation, SeatStatus, StudentProfile, StudentSubscription, SubscriptionStatus, Shift }'
    )
elif 'import { ' in content and 'Shift' not in content[:500]:
    content = content.replace('import { Seat,', 'import { Seat, Shift,')


# Update allocateSeat
old_alloc = """
    const existingAllocation = await SeatAllocation.findOne({
      where: {
        seatId,
        shiftId,
        isActive: true,
      },
    });
    if (existingAllocation) {
      throw new BadRequestException('Seat is already occupied in this shift');
    }
"""

new_alloc = """
    const shiftObj = await Shift.findByPk(shiftId);
    if (!shiftObj) throw new NotFoundException('Shift not found');
    const targetShiftIds = (shiftObj.type === 'CLUBBED' && shiftObj.baseShiftIds && shiftObj.baseShiftIds.length > 0) ? shiftObj.baseShiftIds : [shiftId];

    for (const sid of targetShiftIds) {
      const existingAllocation = await SeatAllocation.findOne({
        where: { seatId, shiftId: sid, isActive: true },
      });
      if (existingAllocation) {
        throw new BadRequestException('Seat is already occupied in one of the required shifts');
      }
    }
"""
content = content.replace(old_alloc, new_alloc)

old_create = """
    // Create allocation
    const allocation = await SeatAllocation.create({
      workspaceId: student.workspaceId,
      studentProfileId,
      seatId,
      shiftId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: true,
    } as any);

    // Update seat status to OCCUPIED
    await seat.update({ status: SeatStatus.OCCUPIED });

    return allocation;
"""

new_create = """
    // Create allocation for each target shift
    let lastAlloc;
    for (const sid of targetShiftIds) {
      lastAlloc = await SeatAllocation.create({
        workspaceId: student.workspaceId,
        studentProfileId,
        seatId,
        shiftId: sid,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: true,
      } as any);
    }

    // Update seat status to OCCUPIED
    await seat.update({ status: SeatStatus.OCCUPIED });

    return lastAlloc;
"""
content = content.replace(old_create, new_create)

# Update transferSeat
old_transfer_check = """
    const targetSeatShiftAlloc = await SeatAllocation.findOne({
      where: {
        seatId: targetSeatId,
        shiftId: allocation.shiftId,
        isActive: true,
      }
    });
    if (targetSeatShiftAlloc) {
      throw new BadRequestException('Target seat is already occupied in this shift');
    }
"""

new_transfer_check = """
    // When transferring, we need to find ALL active allocations for this student on the old seat
    // because they might have been booked under a clubbed shift (resulting in multiple allocations)
    const allStudentAllocsOnOldSeat = await SeatAllocation.findAll({
      where: {
        studentProfileId: allocation.studentProfileId,
        seatId: allocation.seatId,
        isActive: true
      }
    });

    for (const alloc of allStudentAllocsOnOldSeat) {
      const targetSeatShiftAlloc = await SeatAllocation.findOne({
        where: { seatId: targetSeatId, shiftId: alloc.shiftId, isActive: true }
      });
      if (targetSeatShiftAlloc) {
        throw new BadRequestException('Target seat is already occupied in one of the required shifts');
      }
    }
"""
content = content.replace(old_transfer_check, new_transfer_check)

old_transfer_create = """
    // Deactivate old allocation
    await allocation.update({ isActive: false });
    if (oldSeat) {
      const oldSeatActiveCount = await SeatAllocation.count({
        where: { seatId: allocation.seatId, isActive: true }
      });
      if (oldSeatActiveCount === 0) {
        await oldSeat.update({ status: SeatStatus.AVAILABLE });
      }
    }

    // Create new allocation
    const newAllocation = await SeatAllocation.create({
      workspaceId: allocation.workspaceId,
      studentProfileId: allocation.studentProfileId,
      seatId: targetSeatId,
      shiftId: allocation.shiftId,
      startDate: new Date(),
      endDate: allocation.endDate,
      isActive: true,
    } as any);

    // Update target seat status
    await targetSeat.update({ status: SeatStatus.OCCUPIED });

    return newAllocation;
"""

new_transfer_create = """
    let lastNewAlloc;
    for (const alloc of allStudentAllocsOnOldSeat) {
      await alloc.update({ isActive: false });
      
      lastNewAlloc = await SeatAllocation.create({
        workspaceId: alloc.workspaceId,
        studentProfileId: alloc.studentProfileId,
        seatId: targetSeatId,
        shiftId: alloc.shiftId,
        startDate: new Date(),
        endDate: alloc.endDate,
        isActive: true,
      } as any);
    }
    
    if (oldSeat) {
      const oldSeatActiveCount = await SeatAllocation.count({
        where: { seatId: allocation.seatId, isActive: true }
      });
      if (oldSeatActiveCount === 0) {
        await oldSeat.update({ status: SeatStatus.AVAILABLE });
      }
    }

    // Update target seat status
    await targetSeat.update({ status: SeatStatus.OCCUPIED });

    return lastNewAlloc;
"""
content = content.replace(old_transfer_create, new_transfer_create)

with open(file_path, 'w') as f:
    f.write(content)
print("Updated seat.service.ts")
