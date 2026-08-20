import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getSuperAdminDashboard() {
    const cacheKey = 'dashboard:superadmin';
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

    const [
      totalInstitutions,
      totalUsers,
      totalStudents,
      totalStaff,
      activeInstitutions,
    ] = await Promise.all([
      this.prisma.institution.count(),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'Student' } }),
      this.prisma.staff.count(),
      this.prisma.institution.count({ where: { isActive: true } }),
    ]);

    const recentInstitutions = await this.prisma.institution.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const result = {
      stats: {
        totalInstitutions,
        totalUsers,
        totalStudents,
        totalStaff,
        activeInstitutions,
      },
      recentInstitutions,
    };
    await this.redis.set(cacheKey, result, 60);
    return result;
  }

  async getAdminDashboard(institutionId: string) {
    const cacheKey = `dashboard:admin:${institutionId}`;
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

    const [
      institution,
      totalStudents,
      totalStaff,
      totalDepartments,
      totalClasses,
      totalSubjects,
      todayAttendance,
      pendingFees,
      totalFeeCollected,
    ] = await Promise.all([
      this.prisma.institution.findUnique({ where: { id: institutionId } }),
      this.prisma.user.count({ where: { role: 'Student', institutionId } }),
      this.prisma.staff.count({ where: { institutionId, status: 'active' } }),
      this.prisma.department.count({ where: { institutionId, status: 'active' } }),
      this.prisma.class.count({ where: { institutionId, status: 'active' } }),
      this.prisma.subject.count({ where: { institutionId, status: 'active' } }),
      this.prisma.attendance.count({
        where: {
          institutionId,
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      this.prisma.feePayment.count({
        where: { institutionId, status: { in: ['Pending', 'Overdue'] } },
      }),
      this.prisma.feePayment.aggregate({
        where: { institutionId, status: 'Paid' },
        _sum: { paidAmount: true },
      }),
    ]);

    const currentYear = await this.prisma.academicYear.findFirst({
      where: { institutionId, isCurrent: true },
    });

    const result = {
      institution,
      currentYear,
      stats: {
        totalStudents,
        totalStaff,
        totalDepartments,
        totalClasses,
        totalSubjects,
        todayAttendance,
        pendingFees,
        totalFeeCollected: totalFeeCollected._sum.paidAmount || 0,
      },
    };
    await this.redis.set(cacheKey, result, 30);
    return result;
  }

  async getStudentDashboard(institutionId: string, studentId: string) {
    const cacheKey = `dashboard:student:${studentId}`;
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

    const [student, attendance, results, fees] = await Promise.all([
      this.prisma.user.findFirst({
        where: { id: studentId, institutionId },
        select: { id: true, name: true, email: true, rollNo: true, className: true, section: true, avatar: true },
      }),
      this.prisma.attendance.findMany({
        where: { studentId, institutionId },
        orderBy: { date: 'desc' },
        take: 30,
      }),
      this.prisma.result.findMany({
        where: { studentId, institutionId },
        include: { subject: { select: { subjectName: true, subjectCode: true, credits: true } } },
        orderBy: [{ term: 'asc' }, { examType: 'asc' }],
      }),
      this.prisma.feePayment.findMany({
        where: { studentId, institutionId },
        orderBy: { dueDate: 'desc' },
        take: 10,
      }),
    ]);

    // Attendance summary
    const totalClasses = attendance.length;
    const present = attendance.filter((a) => a.status === 'Present').length;
    const absent = attendance.filter((a) => a.status === 'Absent').length;
    const attendancePercentage = totalClasses > 0 ? Number(((present / totalClasses) * 100).toFixed(2)) : 0;

    // Results summary
    const averagePercentage = results.length > 0
      ? Number((results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length).toFixed(2))
      : 0;

    // Fee summary
    const totalDue = fees.reduce((sum, f) => sum + f.amount, 0);
    const totalPaid = fees.filter((f) => f.status === 'Paid').reduce((sum, f) => sum + f.paidAmount, 0);

    const result = {
      student,
      attendance: {
        totalClasses,
        present,
        absent,
        late: attendance.filter((a) => a.status === 'Late').length,
        percentage: attendancePercentage,
        recent: attendance.slice(0, 10),
      },
      results: {
        totalSubjects: results.length,
        averagePercentage,
        recent: results.slice(-5),
      },
      fees: {
        totalDue,
        totalPaid,
        pendingAmount: totalDue - totalPaid,
        pendingCount: fees.filter((f) => f.status === 'Pending' || f.status === 'Overdue').length,
        recent: fees.slice(0, 5),
      },
    };
    await this.redis.set(cacheKey, result, 30);
    return result;
  }

  async getFacultyDashboard(institutionId: string, facultyId: string) {
    const staff = await this.prisma.staff.findFirst({
      where: { userId: facultyId, institutionId },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalStudents, classesAssigned, todayClasses, recentAttendance] = await Promise.all([
      this.prisma.user.count({ where: { institutionId, role: 'Student' } }),
      this.prisma.subject.count({
        where: {
          institutionId,
          classId: staff?.assignedClassId || undefined,
        },
      }),
      this.prisma.attendance.findMany({
        where: {
          institutionId,
          date: { gte: today },
          teacherId: staff?.employeeId || undefined,
        },
        take: 10,
      }),
      this.prisma.attendance.findMany({
        where: { institutionId, teacherId: staff?.employeeId || undefined },
        orderBy: { date: 'desc' },
        take: 20,
      }),
    ]);

    return {
      staff,
      stats: {
        totalStudents,
        classesAssigned,
        todayMarked: todayClasses.length,
      },
      recentAttendance,
    };
  }
}

