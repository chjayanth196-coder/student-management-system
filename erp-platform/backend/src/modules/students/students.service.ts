import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Gender } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(institutionId: string, dto: CreateStudentDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already exists');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: 'Student',
        phone: dto.phone,
        gender: dto.gender as Gender | null | undefined,
        dob: dto.dob ? new Date(dto.dob) : undefined,
        address: dto.address,
        rollNo: dto.rollNo,
        enrollmentNo: dto.enrollmentNo,
        className: dto.className,
        section: dto.section,
        parentName: dto.parentName,
        parentPhone: dto.parentPhone,
        admissionYear: dto.admissionYear,
        semester: dto.semester,
        isActive: true,
        institutionId,
      },
    });
  }

  async findAll(institutionId: string, query?: { search?: string; page?: number; limit?: number }) {
    const where: any = { role: 'Student', institutionId };
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { rollNo: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findById(institutionId: string, id: string) {
    const student = await this.prisma.user.findFirst({ where: { id, role: 'Student', institutionId } });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async update(institutionId: string, id: string, dto: UpdateStudentDto) {
    await this.findById(institutionId, id);
    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.gender !== undefined) updateData.gender = dto.gender as Gender | null | undefined;
    if (dto.dob !== undefined) updateData.dob = new Date(dto.dob);
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.rollNo !== undefined) updateData.rollNo = dto.rollNo;
    if (dto.enrollmentNo !== undefined) updateData.enrollmentNo = dto.enrollmentNo;
    if (dto.className !== undefined) updateData.className = dto.className;
    if (dto.section !== undefined) updateData.section = dto.section;
    if (dto.parentName !== undefined) updateData.parentName = dto.parentName;
    if (dto.parentPhone !== undefined) updateData.parentPhone = dto.parentPhone;
    if (dto.admissionYear !== undefined) updateData.admissionYear = dto.admissionYear;
    if (dto.semester !== undefined) updateData.semester = dto.semester;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    return this.prisma.user.update({ where: { id }, data: updateData });
  }

  async remove(institutionId: string, id: string) {
    await this.findById(institutionId, id);
    await this.prisma.user.update({ where: { id }, data: { isActive: false } });
    return { message: 'Student deactivated successfully' };
  }
}
