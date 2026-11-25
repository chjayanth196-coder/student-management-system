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

  async findBySection(
    institutionId: string,
    sectionId: string,
    query?: { date?: string; subjectId?: string; startDate?: string; endDate?: string },
  ) {
    const where: any = { institutionId, sectionId };
    if (query?.date) {
      const day = new Date(query.date);
      const start = new Date(day);
      start.setHours(0, 0, 0, 0);
      const end = new Date(day);
      end.setHours(23, 59, 59, 999);
      where.date = { gte: start, lte: end };
    } else if (query?.startDate || query?.endDate) {
      where.date = {};
      if (query?.startDate) where.date.gte = new Date(query.startDate);
      if (query?.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }
    if (query?.subjectId) where.subjectId = query.subjectId;
    return this.prisma.attendance.findMany({ where, orderBy: { date: 'desc' } });
  }

  async getSectionReport(
    institutionId: string,
    sectionId: string,
    query?: { subjectId?: string; startDate?: string; endDate?: string },
  ) {
    const section = await this.prisma.section.findFirst({
      where: { id: sectionId, institutionId },
      include: { class: true },
    });
    if (!section) throw new NotFoundException('Section not found');

    const studentWhere: any = {
      institutionId,
      role: 'Student',
      section: section.sectionName,
    };
    if (section.class?.className) studentWhere.className = section.class.className;

    const [students, records] = await Promise.all([
      this.prisma.user.findMany({
        where: studentWhere,
        select: { id: true, name: true, rollNo: true, email: true },
        orderBy: { name: 'asc' },
      }),
      this.findBySection(institutionId, sectionId, query),
    ]);

    const counters = new Map<string, { present: number; absent: number; late: number; total: number }>();
    for (const r of records) {
      const c = counters.get(r.studentId) || { present: 0, absent: 0, late: 0, total: 0 };
      c.total += 1;
      if (r.status === 'Present') c.present += 1;
      else if (r.status === 'Absent') c.absent += 1;
      else if (r.status === 'Late') c.late += 1;
      counters.set(r.studentId, c);
    }

    const studentRows = students.map((s) => {
      const c = counters.get(s.id) || { present: 0, absent: 0, late: 0, total: 0 };
      const percentage = c.total > 0 ? Number(((c.present / c.total) * 100).toFixed(2)) : 0;
      return { ...s, ...c, percentage };
    });

    const summary = studentRows.reduce(
      (acc, row) => {
        acc.present += row.present;
        acc.absent += row.absent;
        acc.late += row.late;
        acc.records += row.total;
        return acc;
      },
      { totalStudents: studentRows.length, records: 0, present: 0, absent: 0, late: 0 },
    );
    const marked = summary.present + summary.absent + summary.late;
    const percentage = marked > 0 ? Number(((summary.present / marked) * 100).toFixed(2)) : 0;

    return {
      section: {
        id: section.id,
        sectionName: section.sectionName,
        classId: section.classId,
        className: section.class?.className,
      },
      summary: { ...summary, percentage },
      students: studentRows,
    };
  }

  async getInstitutionOverview(
    institutionId: string,
    query?: { startDate?: string; endDate?: string },
  ) {
    const where: any = { institutionId };
    if (query?.startDate || query?.endDate) {
      where.date = {};
      if (query?.startDate) where.date.gte = new Date(query.startDate);
      if (query?.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    const records = await this.prisma.attendance.findMany({
      where,
      select: { date: true, status: true },
      orderBy: { date: 'asc' },
    });

    const byDay = new Map<string, { present: number; absent: number; late: number }>();
    for (const r of records) {
      const day = new Date(r.date).toISOString().slice(0, 10);
      const c = byDay.get(day) || { present: 0, absent: 0, late: 0 };
      if (r.status === 'Present') c.present += 1;
      else if (r.status === 'Absent') c.absent += 1;
      else if (r.status === 'Late') c.late += 1;
      byDay.set(day, c);
    }

    const daily = Array.from(byDay.entries()).map(([date, v]) => ({ date, ...v }));
    const totals = records.reduce(
      (acc, r) => {
        if (r.status === 'Present') acc.present += 1;
        else if (r.status === 'Absent') acc.absent += 1;
        else if (r.status === 'Late') acc.late += 1;
        acc.total += 1;
        return acc;
      },
      { total: 0, present: 0, absent: 0, late: 0 },
    );
    const percentage = totals.total > 0 ? Number(((totals.present / totals.total) * 100).toFixed(2)) : 0;

    return { totals: { ...totals, percentage }, daily };
  }

  async getMyAttendance(institutionId: string, userId: string) {
    const records = await this.prisma.attendance.findMany({
      where: { studentId: userId, institutionId },
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

