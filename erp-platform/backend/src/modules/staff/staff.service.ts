import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Gender, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  async getNextEmployeeId(institutionId: string): Promise<string> {
    const count = await this.prisma.staff.count({ where: { institutionId } });
    return `EMP-${String(count + 1).padStart(4, '0')}`;
  }

  async create(institutionId: string, dto: CreateStaffDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) throw new ConflictException('Email already exists');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const employeeId = await this.getNextEmployeeId(institutionId);

    const user = await this.prisma.user.create({
      data: {
        name: `${dto.firstName} ${dto.lastName}`,
        email: dto.email,
        password: hashedPassword,
        role: 'Faculty',
        phone: dto.phone,
        institutionId,
        isActive: true,
      },
    });

    return this.prisma.staff.create({
      data: {
        employeeId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        staffType: dto.staffType,
        phone: dto.phone,
        gender: dto.gender as Gender | null | undefined,
        dob: dto.dob ? new Date(dto.dob) : undefined,
        address: dto.address,
        qualification: dto.qualification,
        specialization: dto.specialization,
        experience: dto.experience,
        joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : undefined,
        designation: dto.designation,
        departmentId: dto.departmentId,
        assignedClassId: dto.assignedClassId,
        assignedSectionId: dto.assignedSectionId,
        assignedSubjectIds: dto.assignedSubjectIds || [],
        classTeacher: dto.classTeacher || false,
        salary: dto.salary,
        status: 'active',
        institutionId,
        userId: user.id,
      },
    });
  }

  async findAll(institutionId: string, query?: { search?: string; staffType?: string; status?: string; departmentId?: string; page?: number; limit?: number }) {
    const where: Prisma.StaffWhereInput = { institutionId, deletedAt: null };
    if (query?.staffType) where.staffType = query.staffType;
    if (query?.status) where.status = query.status;
    if (query?.departmentId) where.departmentId = query.departmentId;
    if (query?.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { employeeId: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.staff.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.staff.count({ where }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findById(institutionId: string, id: string) {
    const staff = await this.prisma.staff.findFirst({ where: { id, institutionId, deletedAt: null } });
    if (!staff) throw new NotFoundException('Staff not found');
    return staff;
  }

  async update(institutionId: string, id: string, dto: UpdateStaffDto) {
    await this.findById(institutionId, id);
    const updateData: any = {};
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.qualification !== undefined) updateData.qualification = dto.qualification;
    if (dto.specialization !== undefined) updateData.specialization = dto.specialization;
    if (dto.experience !== undefined) updateData.experience = dto.experience;
    if (dto.designation !== undefined) updateData.designation = dto.designation;
    if (dto.departmentId !== undefined) updateData.departmentId = dto.departmentId;
    if (dto.assignedClassId !== undefined) updateData.assignedClassId = dto.assignedClassId;
    if (dto.assignedSectionId !== undefined) updateData.assignedSectionId = dto.assignedSectionId;
    if (dto.assignedSubjectIds !== undefined) updateData.assignedSubjectIds = dto.assignedSubjectIds;
    if (dto.classTeacher !== undefined) updateData.classTeacher = dto.classTeacher;
    if (dto.salary !== undefined) updateData.salary = dto.salary;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.gender !== undefined) updateData.gender = dto.gender as Gender | null | undefined;

    return this.prisma.staff.update({ where: { id }, data: updateData });
  }

  async remove(institutionId: string, id: string) {
    const staff = await this.findById(institutionId, id);
    await this.prisma.staff.update({ where: { id }, data: { status: 'inactive', deletedAt: new Date() } });
    if (staff.userId) {
      await this.prisma.user.update({ where: { id: staff.userId }, data: { isActive: false } });
    }
    return { message: 'Staff deactivated successfully' };
  }

  async toggleStatus(institutionId: string, id: string, status: string) {
    const staff = await this.findById(institutionId, id);
    const newStatus = status === 'inactive' ? 'inactive' : 'active';
    await this.prisma.staff.update({ where: { id }, data: { status: newStatus } });
    if (staff.userId) {
      await this.prisma.user.update({ where: { id: staff.userId }, data: { isActive: newStatus === 'active' } });
    }
    return { message: `Staff status updated to ${newStatus}` };
  }

  async resetPassword(institutionId: string, id: string, newPassword: string) {
    const staff = await this.findById(institutionId, id);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    if (staff.userId) {
      await this.prisma.user.update({ where: { id: staff.userId }, data: { password: hashedPassword } });
    }
    return { message: 'Password reset successfully' };
  }
}
