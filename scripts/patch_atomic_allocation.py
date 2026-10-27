import re

# 1. Update payment.service.ts
payment_path = '/Users/sudhanshukumar/Desktop/Backend-code/src/services/payment.service.ts'
with open(payment_path, 'r') as f:
    payment_content = f.read()

# Update signature of createPayment
old_sig = 'async createPayment(data: any, allowPartial = false) {'
new_sig = 'async createPayment(data: any, allowPartial = false, existingTransaction?: Transaction) {'
if old_sig in payment_content:
    payment_content = payment_content.replace(old_sig, new_sig)

# Update StudentProfile.findByPk
old_student = 'const student = await StudentProfile.findByPk(data.studentProfileId);'
new_student = 'const student = await StudentProfile.findByPk(data.studentProfileId, existingTransaction ? { transaction: existingTransaction } : undefined);'
if old_student in payment_content:
    payment_content = payment_content.replace(old_student, new_student)

# Update SubscriptionPlan.findOne
old_plan_find = """      plan = await SubscriptionPlan.findOne({
        where: {
          id: data.subscriptionPlanId,
          workspaceId: student.workspaceId,
          isActive: true,
        },
      });"""
new_plan_find = """      plan = await SubscriptionPlan.findOne({
        where: {
          id: data.subscriptionPlanId,
          workspaceId: student.workspaceId,
          isActive: true,
        },
        transaction: existingTransaction,
      });"""
if old_plan_find in payment_content:
    payment_content = payment_content.replace(old_plan_find, new_plan_find)

# Update Shift.findOne
old_shift_find = """      const shift = await Shift.findOne({
        where: { id: data.shiftId, workspaceId: student.workspaceId },
      });"""
new_shift_find = """      const shift = await Shift.findOne({
        where: { id: data.shiftId, workspaceId: student.workspaceId },
        transaction: existingTransaction,
      });"""
if old_shift_find in payment_content:
    payment_content = payment_content.replace(old_shift_find, new_shift_find)

# Update SubscriptionPlan.findOrCreate
old_plan_create = """      [plan] = await SubscriptionPlan.findOrCreate({
        where: { workspaceId: student.workspaceId, name },
        defaults: {
          workspaceId: student.workspaceId,
          name,
          price,
          durationDays: months * 30,
          isActive: true,
        } as any,
      });"""
new_plan_create = """      [plan] = await SubscriptionPlan.findOrCreate({
        where: { workspaceId: student.workspaceId, name },
        defaults: {
          workspaceId: student.workspaceId,
          name,
          price,
          durationDays: months * 30,
          isActive: true,
        } as any,
        transaction: existingTransaction,
      });"""
if old_plan_create in payment_content:
    payment_content = payment_content.replace(old_plan_create, new_plan_create)

# Update payment creation transaction logic
old_payment_tx = """    const payment = await sequelize.transaction(async (transaction) => {
      const row = await Payment.create(
        {
          workspaceId: student.workspaceId,
          branchId: student.branchId,
          studentProfileId: student.id,
          amount,
          totalAmount,
          discountAmount,
          method: data.method,
          subscriptionPlanId: plan?.id ?? null,
          status: PaymentStatus.UNPAID,
          dueDate: new Date(Date.now() + 7 * 86400000),
        } as any,
        { transaction },
      );
      if (data.method === PaymentMethod.CASH || data.method === PaymentMethod.UPI)
        await this.settle(row, `${data.method}-${crypto.randomUUID()}`, transaction);
      return row;
    });"""

new_payment_tx = """    const runInTx = async (transaction: Transaction) => {
      const row = await Payment.create(
        {
          workspaceId: student.workspaceId,
          branchId: student.branchId,
          studentProfileId: student.id,
          amount,
          totalAmount,
          discountAmount,
          method: data.method,
          subscriptionPlanId: plan?.id ?? null,
          status: PaymentStatus.UNPAID,
          dueDate: new Date(Date.now() + 7 * 86400000),
        } as any,
        { transaction },
      );
      if (data.method === PaymentMethod.CASH || data.method === PaymentMethod.UPI)
        await this.settle(row, `${data.method}-${crypto.randomUUID()}`, transaction);
      return row;
    };

    const payment = existingTransaction
      ? await runInTx(existingTransaction)
      : await sequelize.transaction(runInTx);"""
if old_payment_tx in payment_content:
    payment_content = payment_content.replace(old_payment_tx, new_payment_tx)

# Update Razorpay update call to use existingTransaction if present
old_rzp_update = 'await payment.update({ orderId: order.id, transactionId: order.id });'
new_rzp_update = 'await payment.update({ orderId: order.id, transactionId: order.id }, existingTransaction ? { transaction: existingTransaction } : undefined);'
if old_rzp_update in payment_content:
    payment_content = payment_content.replace(old_rzp_update, new_rzp_update)

with open(payment_path, 'w') as f:
    f.write(payment_content)
print("Updated payment.service.ts successfully")


# 2. Update seat.service.ts
seat_path = '/Users/sudhanshukumar/Desktop/Backend-code/src/services/seat.service.ts'
with open(seat_path, 'r') as f:
    seat_content = f.read()

# Make sure PaymentService is imported
if 'import { PaymentService }' not in seat_content:
    seat_content = "import { PaymentService } from './payment.service';\n" + seat_content
    # Add paymentService instance
    seat_content = re.sub(
        r'(export class SeatService \{)',
        r'const paymentService = new PaymentService();\n\n\1',
        seat_content,
        count=1
    )

# Update allocateSeat to accept payment and execute atomically
old_alloc_return = """      for (const id of new Set([...old.map((a) => a.seatId), seatId]))
        await this.refreshSeat(id, transaction);
      return result;
    });
  }"""

new_alloc_return = """      for (const id of new Set([...old.map((a) => a.seatId), seatId]))
        await this.refreshSeat(id, transaction);

      // If payment data is provided, execute payment within the EXACT SAME transaction!
      // If payment fails (e.g. invalid amount, discount exceeds total, network/validation error),
      // the error will throw here, causing Sequelize to ROLLBACK the entire transaction.
      // The seat allocation, seat status update, and old allocation deactivation will all be reverted!
      let paymentResult: any = null;
      if (data.payment) {
        paymentResult = await paymentService.createPayment(
          {
            ...data.payment,
            studentProfileId,
            shiftId: data.payment.shiftId || shift.id,
          },
          true,
          transaction,
        );
      }

      const resObj = typeof (result as any).toJSON === 'function' ? (result as any).toJSON() : result;
      return {
        ...resObj,
        payment: paymentResult?.payment,
        razorpayOrder: paymentResult?.razorpayOrder,
      };
    });
  }"""

if old_alloc_return in seat_content:
    seat_content = seat_content.replace(old_alloc_return, new_alloc_return)
else:
    print("Warning: old_alloc_return pattern not found in seat.service.ts")

with open(seat_path, 'w') as f:
    f.write(seat_content)
print("Updated seat.service.ts successfully")
