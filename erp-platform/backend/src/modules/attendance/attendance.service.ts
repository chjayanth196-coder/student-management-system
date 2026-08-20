import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MarkAttendanceDto, AttendanceStatus } from './dto/mark-attendance.dto';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async mark(institutionId: string, sectionId: string, subjectId: string, dto: MarkAttendanceDto) {
    const student = await this.prisma.user.findFirst({
      where: { id: dto.studentId, role: 'Student', institutionId },
    });
    if (!student) throw new NotFoundException('Student not found');

    const existing = await this.prisma.attendance.findFirst({
      where: {
        studentId: dto.studentId,
        date: new Date(dto.date),
        institutionId,
        sectionId,
        subjectId,
      },
    });
    if (existing) throw new ConflictException('Attendance already marked for this student/date/subject');

    return this.prisma.attendance.create({
      data: {
        studentId: dto.studentId,
        date: new Date(dto.date),
        status: dto.status as string,
        remarks: dto.remarks,
        institutionId,
        sectionId,
        subjectId,
        markedBy: institutionId,
      },
    });
  }

  async markBulk(institutionId: string, sectionId: string, subjectId: string, dto: BulkAttendanceDto) {
    const date = new Date(dto.date);

    const existingRecords = await this.prisma.attendance.findMany({
      where: {
        institutionId,
        sectionId,
        subjectId,
        date,
        studentId: { in: dto.records.map((r) => r.studentId) },
      },
      select: { studentId: true },
    });

    const existingSet = new Set(existingRecords.map((r) => r.studentId));
    const toCreate = dto.records
      .filter((r) => !existingSet.has(r.studentId))
      .map((r) => ({
        studentId: r.studentId,
        date,
        status: r.status as string,
        remarks: dto.remarks,
        institutionId,
        sectionId,
        subjectId,
        teacherId: dto.teacherId,
        markedBy: institutionId,
      }));

    if (toCreate.length > 0) {
      await this.prisma.attendance.createMany({ data: toCreate, skipDuplicates: true });
    }

    return { created: toCreate.length, skipped: dto.records.length - toCreate.length };
  }

  async findByStudent(institutionId: string, studentId: string, query?: { startDate?: string; endDate?: string }) {
    const where: any = { institutionId, studentId };
    if (query?.startDate || query?.endDate) {
      where.date = {};
      if (query?.startDate) where.date.gte = new Date(query.startDate);
      if (query?.endDate) where.date.lte = new Date(query.endDate);
    }
    return this.prisma.attendance.findMany({ where, orderBy: { date: 'desc' } });
  }

  async getMyAttendance(userId: string) {
    const records = await this.prisma.attendance.findMany({
      where: { studentId: userId },
      orderBy: { date: 'desc' },
    });
    const total = records.length;
    const present = records.filter((r) => r.status === 'Present').length;
    const absent = records.filter((r) => r.status === 'Absent').length;
    const late = records.filter((r) => r.status === 'Late').length;
    const percentage = total > 0 ? Number(((present / total) * 100).toFixed(2)) : 0;

    return { records, summary: { total, present, absent, late, percentage } };
  }

  async update(institutionId: string, id: string, status: AttendanceStatus) {
    const record = await this.prisma.attendance.findFirst({ where: { id, institutionId } });
    if (!record) throw new NotFoundException('Attendance record not found');
    return this.prisma.attendance.update({ where: { id }, data: { status: status as string } });
  }

  async remove(institutionId: string, id: string) {
    const record = await this.prisma.attendance.findFirst({ where: { id, institutionId } });
    if (!record) throw new NotFoundException('Attendance record not found');
    await this.prisma.attendance.delete({ where: { id } });
    return { message: 'Attendance record removed' };
  }
}

