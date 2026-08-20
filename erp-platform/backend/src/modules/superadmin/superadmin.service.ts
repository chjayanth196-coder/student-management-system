import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class SuperAdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verify the Super Admin's own password before revealing college credentials.
   */
  async verifyOwnPassword(superAdminId: string, password: string) {
    const superAdmin = await this.prisma.user.findUnique({ where: { id: superAdminId } });
    if (!superAdmin || superAdmin.role !== 'SuperAdmin') {
      throw new UnauthorizedException('Not authorized');
    }
    const valid = await bcrypt.compare(password, superAdmin.password);
    if (!valid) {
      throw new UnauthorizedException('Your password is incorrect');
    }
    return { verified: true };
  }

  /**
   * List all institutions with their admin login id (email) and plaintext password.
   * Only returns the plainPassword for auto-created CollegeAdmin accounts.
   */
  async getCollegeCredentials() {
    const institutions = await this.prisma.institution.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        type: true,
        slug: true,
        isActive: true,
        createdAt: true,
        users: {
          where: { role: 'CollegeAdmin' },
          select: { id: true, email: true, plainPassword: true, name: true, isActive: true },
          take: 1,
        },
      },
    });

    return institutions.map((inst) => {
      const admin = inst.users[0] || null;
      return {
        institutionId: inst.id,
        institutionName: inst.name,
        type: inst.type,
        slug: inst.slug,
        isActive: inst.isActive,
        createdAt: inst.createdAt,
        admin: admin
          ? {
              adminId: admin.id,
              loginId: admin.email,
              password: admin.plainPassword || null,
              adminName: admin.name,
              isActive: admin.isActive,
            }
          : null,
      };
    });
  }

  /**
   * Reset an institution's admin password. Only Super Admin can call this.
   */
  async resetAdminPassword(superAdminId: string, institutionId: string, newPassword: string) {
    const superAdmin = await this.prisma.user.findUnique({ where: { id: superAdminId } });
    if (!superAdmin || superAdmin.role !== 'SuperAdmin') {
      throw new UnauthorizedException('Only Super Admin can reset institution admin passwords');
    }

    const institution = await this.prisma.institution.findUnique({ where: { id: institutionId } });
    if (!institution) {
      throw new NotFoundException('Institution not found');
    }

    const admin = await this.prisma.user.findFirst({
      where: { institutionId, role: 'CollegeAdmin' },
    });
    if (!admin) {
      throw new NotFoundException('No CollegeAdmin account found for this institution');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    const updated = await this.prisma.user.update({
      where: { id: admin.id },
      data: { password: hashed, plainPassword: newPassword },
      select: { id: true, email: true, name: true, role: true, plainPassword: true },
    });

    return { message: 'Password reset successfully', admin: updated };
  }
}
