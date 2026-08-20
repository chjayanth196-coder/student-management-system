import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Platform-wide analytics: every institution ranked by growth, placements,
   * highest package, and total income collected.
   */
  async getPlatformAnalytics() {
    const institutions = await this.prisma.institution.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, type: true, city: true, state: true, isActive: true, createdAt: true },
    });

    const rows = await Promise.all(
      institutions.map((inst) => this.getInstitutionSummary(inst.id, inst as any)),
    );

    // Sort by total income (desc) as default ranking
    const ranked = [...rows].sort((a, b) => b.totalIncome - a.totalIncome);

    const totals = {
      institutions: institutions.length,
      totalIncome: rows.reduce((s, r) => s + r.totalIncome, 0),
      totalStudents: rows.reduce((s, r) => s + r.students, 0),
      totalStaff: rows.reduce((s, r) => s + r.staff, 0),
      totalPlacements: rows.reduce((s, r) => s + r.placements, 0),
      highestPackageOverall: rows.reduce((m, r) => Math.max(m, r.highestPackage), 0),
    };

    return { totals, institutions: ranked };
  }

  /**
   * Deep analytics for a single institution.
   */
  async getInstitutionAnalytics(institutionId: string) {
    const institution = await this.prisma.institution.findUnique({ where: { id: institutionId } });
    if (!institution) {
      throw new NotFoundException('Institution not found');
    }

    const summary = await this.getInstitutionSummary(institutionId, institution);

    // Yearly income breakdown based on FeePayment.paidDate
    const payments = await this.prisma.feePayment.findMany({
      where: { institutionId },
      select: { paidAmount: true, paidDate: true, status: true },
    });

    const yearlyIncome: Record<string, { year: string; income: number; payments: number }> = {};
    for (const p of payments) {
      if (p.status !== 'Paid' && p.status !== 'Partial') continue;
      const year = p.paidDate ? p.paidDate.getFullYear().toString() : 'unknown';
      if (!yearlyIncome[year]) yearlyIncome[year] = { year, income: 0, payments: 0 };
      yearlyIncome[year].income += p.paidAmount;
      yearlyIncome[year].payments += 1;
    }
    const incomeByYear = Object.values(yearlyIncome).sort((a, b) => a.year.localeCompare(b.year));

    // Placement breakdown
    const placements = await this.prisma.placement.findMany({
      where: { institutionId },
      select: { companyName: true, jobTitle: true, package: true, status: true },
      orderBy: { package: 'desc' },
    });

    return {
      institution,
      summary,
      incomeByYear,
      placements,
    };
  }

  /**
   * Side-by-side comparison of multiple institutions.
   */
  async getComparison(ids?: string[]) {
    const where = ids && ids.length ? { id: { in: ids } } : {};
    const institutions = await this.prisma.institution.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, type: true, city: true, state: true, isActive: true, createdAt: true },
    });

    const items = await Promise.all(
      institutions.map((inst) => this.getInstitutionSummary(inst.id, inst as any)),
    );

    return items;
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private async getInstitutionSummary(institutionId: string, institution: any) {
    const [
      students,
      staff,
      departments,
      classes,
      subjects,
      placements,
      placementAgg,
      feeAgg,
      pendingFees,
    ] = await Promise.all([
      this.prisma.user.count({ where: { institutionId, role: 'Student' } }),
      this.prisma.staff.count({ where: { institutionId, status: 'active' } }),
      this.prisma.department.count({ where: { institutionId, status: 'active' } }),
      this.prisma.class.count({ where: { institutionId, status: 'active' } }),
      this.prisma.subject.count({ where: { institutionId, status: 'active' } }),
      this.prisma.placement.count({ where: { institutionId } }),
      this.prisma.placement.aggregate({
        where: { institutionId },
        _max: { package: true },
        _avg: { package: true },
      }),
      this.prisma.feePayment.aggregate({
        where: { institutionId, status: { in: ['Paid', 'Partial'] } },
        _sum: { paidAmount: true },
      }),
      this.prisma.feePayment.count({
        where: { institutionId, status: { in: ['Pending', 'Overdue'] } },
      }),
    ]);

    return {
      id: institution.id,
      name: institution.name,
      type: institution.type,
      city: institution.city,
      state: institution.state,
      isActive: institution.isActive,
      createdAt: institution.createdAt,
      students,
      staff,
      departments,
      classes,
      subjects,
      placements,
      highestPackage: placementAgg._max.package || 0,
      averagePackage: placementAgg._avg.package || 0,
      totalIncome: feeAgg._sum.paidAmount || 0,
      pendingFees,
    };
  }
}
