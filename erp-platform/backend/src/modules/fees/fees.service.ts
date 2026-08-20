import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';
import { UpdateFeeStructureDto } from './dto/update-fee-structure.dto';
import { CreateFeePaymentDto } from './dto/create-fee-payment.dto';

@Injectable()
export class FeesService {
  constructor(private readonly prisma: PrismaService) {}

  // ========================
  // FEE STRUCTURE
  // ========================

  async createStructure(institutionId: string, dto: CreateFeeStructureDto) {
    const existing = await this.prisma.feeStructure.findUnique({
      where: {
        institutionId_name: {
          institutionId,
          name: dto.name,
        },
      },
    });
    if (existing) throw new ConflictException('Fee structure with this name already exists');

    return this.prisma.feeStructure.create({
      data: {
        name: dto.name,
        category: dto.category,
        amount: dto.amount,
        frequency: dto.frequency,
        dueDay: dto.dueDay,
        lateFee: dto.lateFee ?? 0,
        isOptional: dto.isOptional ?? false,
        description: dto.description,
        isActive: true,
        institutionId,
      },
    });
  }

  async findAllStructures(institutionId: string, query?: { category?: string; isActive?: string }) {
    const where: any = { institutionId };
    if (query?.category) where.category = query.category;
    if (query?.isActive !== undefined) where.isActive = query.isActive === 'true';
    return this.prisma.feeStructure.findMany({ where, orderBy: { name: 'asc' } });
  }

  async findStructureById(institutionId: string, id: string) {
    const structure = await this.prisma.feeStructure.findFirst({
      where: { id, institutionId },
      include: { _count: { select: { feePayments: true } } },
    });
    if (!structure) throw new NotFoundException('Fee structure not found');
    return structure;
  }

  async updateStructure(institutionId: string, id: string, dto: UpdateFeeStructureDto) {
    await this.findStructureById(institutionId, id);
    return this.prisma.feeStructure.update({ where: { id }, data: dto });
  }

  async removeStructure(institutionId: string, id: string) {
    await this.findStructureById(institutionId, id);
    await this.prisma.feeStructure.update({ where: { id }, data: { isActive: false } });
    return { message: 'Fee structure deactivated successfully' };
  }

  // ========================
  // FEE PAYMENTS
  // ========================

  async createPayment(institutionId: string, dto: CreateFeePaymentDto) {
    const student = await this.prisma.user.findFirst({
      where: { id: dto.studentId, role: 'Student', institutionId },
    });
    if (!student) throw new NotFoundException('Student not found in this institution');

    const actualAmount = (dto.amount || 0) + (dto.fine || 0) - (dto.discount || 0);
    const status = this.calculatePaymentStatus(dto.paidAmount, actualAmount, new Date(dto.dueDate));

    return this.prisma.feePayment.create({
      data: {
        studentId: dto.studentId,
        feeStructureId: dto.feeStructureId,
        amount: actualAmount,
        paidAmount: dto.paidAmount,
        dueDate: new Date(dto.dueDate),
        paidDate: dto.paidDate ? new Date(dto.paidDate) : null,
        status,
        paymentMode: dto.paymentMode,
        transactionId: dto.transactionId,
        receiptNo: dto.receiptNo,
        fine: dto.fine ?? 0,
        discount: dto.discount ?? 0,
        remarks: dto.remarks,
        institutionId,
      },
    });
  }

  async findAllPayments(
    institutionId: string,
    query?: { studentId?: string; status?: string; startDate?: string; endDate?: string; page?: number; limit?: number },
  ) {
    const where: any = { institutionId };
    if (query?.studentId) where.studentId = query.studentId;
    if (query?.status) where.status = query.status;
    if (query?.startDate || query?.endDate) {
      where.dueDate = {};
      if (query?.startDate) where.dueDate.gte = new Date(query.startDate);
      if (query?.endDate) where.dueDate.lte = new Date(query.endDate);
    }

    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.feePayment.findMany({
        where,
        include: {
          student: { select: { id: true, name: true, rollNo: true, className: true } },
          feeStructure: { select: { id: true, name: true, category: true } },
        },
        skip,
        take: limit,
        orderBy: { dueDate: 'desc' },
      }),
      this.prisma.feePayment.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findPaymentById(institutionId: string, id: string) {
    const payment = await this.prisma.feePayment.findFirst({
      where: { id, institutionId },
      include: {
        student: { select: { id: true, name: true, rollNo: true, className: true } },
        feeStructure: { select: { id: true, name: true, category: true, amount: true } },
      },
    });
    if (!payment) throw new NotFoundException('Fee payment not found');
    return payment;
  }

  async updatePaymentStatus(institutionId: string, id: string, status: string) {
    const payment = await this.findPaymentById(institutionId, id);
    return this.prisma.feePayment.update({
      where: { id },
      data: { status, paidDate: status === 'Paid' ? new Date() : payment.paidDate },
    });
  }

  async getStudentFeeSummary(institutionId: string, studentId: string) {
    const student = await this.prisma.user.findFirst({
      where: { id: studentId, role: 'Student', institutionId },
    });
    if (!student) throw new NotFoundException('Student not found');

    const [payments, structures] = await Promise.all([
      this.prisma.feePayment.findMany({
        where: { studentId, institutionId },
        orderBy: { dueDate: 'desc' },
      }),
      this.prisma.feeStructure.findMany({
        where: { institutionId, isActive: true },
      }),
    ]);

    const totalDue = structures.reduce((sum: number, s: any) => sum + s.amount, 0);
    const totalPaid = payments
      .filter((p: any) => p.status === 'Paid' || p.status === 'Partial')
      .reduce((sum: number, p: any) => sum + p.paidAmount, 0);
    const totalPending = totalDue - totalPaid;
    const overdueCount = payments.filter((p) => p.status === 'Overdue').length;
    const paidCount = payments.filter((p) => p.status === 'Paid').length;

    return {
      student: { id: student.id, name: student.name, rollNo: student.rollNo, className: student.className },
      summary: {
        totalDue,
        totalPaid,
        totalPending,
        paidCount,
        overdueCount,
        paymentCount: payments.length,
      },
      recentPayments: payments.slice(0, 10),
    };
  }

  async getCollectionReport(
    institutionId: string,
    query?: { startDate?: string; endDate?: string },
  ) {
    const where: any = { institutionId };
    if (query?.startDate || query?.endDate) {
      where.paidDate = {};
      if (query?.startDate) where.paidDate.gte = new Date(query.startDate);
      if (query?.endDate) where.paidDate.lte = new Date(query.endDate);
    }

    const payments = await this.prisma.feePayment.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, className: true } },
      },
      orderBy: { paidDate: 'desc' },
    });

    const totalCollected = payments
      .filter((p) => p.status === 'Paid' || p.status === 'Partial')
      .reduce((sum, p) => sum + p.paidAmount, 0);
    const totalFine = payments.reduce((sum, p) => sum + (p.fine || 0), 0);
    const totalDiscount = payments.reduce((sum, p) => sum + (p.discount || 0), 0);

    return {
      totalPayments: payments.length,
      totalCollected,
      totalFine,
      totalDiscount,
      netCollection: totalCollected - totalDiscount,
      payments,
    };
  }

  private calculatePaymentStatus(paidAmount: number, amount: number, dueDate: Date): string {
    if (paidAmount <= 0) {
      return dueDate < new Date() ? 'Overdue' : 'Pending';
    }
    if (paidAmount >= amount) return 'Paid';
    return 'Partial';
  }
}
