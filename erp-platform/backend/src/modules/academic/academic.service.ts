import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class AcademicService {
  constructor(private readonly prisma: PrismaService) {}

  // ========================
  // ACADEMIC YEARS
  // ========================

  async createAcademicYear(institutionId: string, dto: CreateAcademicYearDto) {
    const existing = await this.prisma.academicYear.findUnique({
      where: {
        institutionId_name: {
          institutionId,
          name: dto.name,
        },
      },
    });
    if (existing) {
      throw new ConflictException('Academic year with this name already exists');
    }

    if (dto.isCurrent) {
      await this.prisma.academicYear.updateMany({
        where: { institutionId, isCurrent: true },
        data: { isCurrent: false },
      });
    }

    return this.prisma.academicYear.create({
      data: {
        name: dto.name,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isCurrent: dto.isCurrent ?? false,
        status: dto.status ?? 'active',
        institutionId,
      },
    });
  }

  async findAllAcademicYears(institutionId: string, query?: { q?: string; status?: string }) {
    const where: any = { institutionId };
    if (query?.status) where.status = query.status;
    if (query?.q) {
      where.OR = [{ name: { contains: query.q, mode: 'insensitive' } }];
    }
    return this.prisma.academicYear.findMany({ where, orderBy: { startDate: 'desc' } });
  }

  async findAcademicYearById(institutionId: string, id: string) {
    const year = await this.prisma.academicYear.findFirst({
      where: { id, institutionId },
    });
    if (!year) throw new NotFoundException('Academic year not found');
    return year;
  }

  async updateAcademicYear(institutionId: string, id: string, dto: UpdateAcademicYearDto) {
    const existing = await this.findAcademicYearById(institutionId, id);

    if (dto.name && dto.name !== existing.name) {
      const dupe = await this.prisma.academicYear.findUnique({
        where: { institutionId_name: { institutionId, name: dto.name } },
      });
      if (dupe) throw new ConflictException('Academic year name already exists');
    }

    if (dto.isCurrent) {
      await this.prisma.academicYear.updateMany({
        where: { institutionId, isCurrent: true, id: { not: id } },
        data: { isCurrent: false },
      });
    }

    return this.prisma.academicYear.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        ...(dto.isCurrent !== undefined && { isCurrent: dto.isCurrent }),
        ...(dto.status && { status: dto.status }),
      },
    });
  }

  // ========================
  // DEPARTMENTS
  // ========================

  async createDepartment(institutionId: string, academicYearId: string, dto: CreateDepartmentDto) {
    await this.findAcademicYearById(institutionId, academicYearId);

    const existing = await this.prisma.department.findUnique({
      where: {
        institutionId_academicYearId_code: {
          institutionId,
          academicYearId,
          code: dto.code,
        },
      },
    });
    if (existing) throw new ConflictException('Department code already exists for this academic year');

    return this.prisma.department.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        hodName: dto.hodName,
        status: dto.status ?? 'active',
        institutionId,
        academicYearId,
      },
    });
  }

  async findAllDepartments(institutionId: string, academicYearId?: string) {
    const where: any = { institutionId };
    if (academicYearId) where.academicYearId = academicYearId;
    return this.prisma.department.findMany({ where, orderBy: { name: 'asc' } });
  }

  async findDepartmentById(institutionId: string, id: string) {
    const dept = await this.prisma.department.findFirst({ where: { id, institutionId } });
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  async updateDepartment(institutionId: string, id: string, dto: UpdateDepartmentDto) {
    await this.findDepartmentById(institutionId, id);
    return this.prisma.department.update({ where: { id }, data: dto });
  }

  async removeDepartment(institutionId: string, id: string) {
    await this.findDepartmentById(institutionId, id);
    await this.prisma.department.update({ where: { id }, data: { status: 'inactive' } });
    return { message: 'Department deactivated successfully' };
  }

  // ========================
  // CLASSES
  // ========================

  async createClass(institutionId: string, academicYearId: string, departmentId: string, dto: CreateClassDto) {
    await this.findDepartmentById(institutionId, departmentId);

    const existing = await this.prisma.class.findUnique({
      where: {
        institutionId_academicYearId_departmentId_classCode: {
          institutionId,
          academicYearId,
          departmentId,
          classCode: dto.classCode,
        },
      },
    });
    if (existing) throw new ConflictException('Class code already exists');

    return this.prisma.class.create({
      data: {
        className: dto.className,
        classCode: dto.classCode,
        semesterOrGrade: dto.semesterOrGrade,
        capacity: dto.capacity,
        status: dto.status ?? 'active',
        institutionId,
        academicYearId,
        departmentId,
      },
    });
  }

  async findAllClasses(institutionId: string, filters?: { academicYearId?: string; departmentId?: string }) {
    const where: any = { institutionId };
    if (filters?.academicYearId) where.academicYearId = filters.academicYearId;
    if (filters?.departmentId) where.departmentId = filters.departmentId;
    return this.prisma.class.findMany({ where, orderBy: { className: 'asc' } });
  }

  async findClassById(institutionId: string, id: string) {
    const cls = await this.prisma.class.findFirst({ where: { id, institutionId } });
    if (!cls) throw new NotFoundException('Class not found');
    return cls;
  }

  async updateClass(institutionId: string, id: string, dto: UpdateClassDto) {
    await this.findClassById(institutionId, id);
    return this.prisma.class.update({ where: { id }, data: dto });
  }

  async removeClass(institutionId: string, id: string) {
    await this.findClassById(institutionId, id);
    await this.prisma.class.update({ where: { id }, data: { status: 'inactive' } });
    return { message: 'Class deactivated successfully' };
  }

  // ========================
  // SECTIONS
  // ========================

  async createSection(institutionId: string, classId: string, dto: CreateSectionDto) {
    const cls = await this.findClassById(institutionId, classId);

    const existing = await this.prisma.section.findUnique({
      where: {
        institutionId_classId_sectionName: {
          institutionId,
          classId,
          sectionName: dto.sectionName,
        },
      },
    });
    if (existing) throw new ConflictException('Section name already exists for this class');

    return this.prisma.section.create({
      data: {
        sectionName: dto.sectionName,
        roomNumber: dto.roomNumber,
        capacity: dto.capacity,
        status: dto.status ?? 'active',
        institutionId,
        classId,
      },
    });
  }

  async findAllSections(institutionId: string, classId?: string) {
    const where: any = { institutionId };
    if (classId) where.classId = classId;
    return this.prisma.section.findMany({ where, orderBy: { sectionName: 'asc' } });
  }

  async findSectionById(institutionId: string, id: string) {
    const section = await this.prisma.section.findFirst({ where: { id, institutionId } });
    if (!section) throw new NotFoundException('Section not found');
    return section;
  }

  async updateSection(institutionId: string, id: string, dto: UpdateSectionDto) {
    await this.findSectionById(institutionId, id);
    return this.prisma.section.update({ where: { id }, data: dto });
  }

  async removeSection(institutionId: string, id: string) {
    await this.findSectionById(institutionId, id);
    await this.prisma.section.update({ where: { id }, data: { status: 'inactive' } });
    return { message: 'Section deactivated successfully' };
  }

  // ========================
  // SUBJECTS
  // ========================

  async createSubject(
    institutionId: string,
    academicYearId: string,
    departmentId: string,
    classId: string,
    dto: CreateSubjectDto,
  ) {
    await this.findClassById(institutionId, classId);

    const existing = await this.prisma.subject.findUnique({
      where: {
        institutionId_academicYearId_departmentId_classId_subjectCode: {
          institutionId,
          academicYearId,
          departmentId,
          classId,
          subjectCode: dto.subjectCode,
        },
      },
    });
    if (existing) throw new ConflictException('Subject code already exists for this class');

    return this.prisma.subject.create({
      data: {
        subjectName: dto.subjectName,
        subjectCode: dto.subjectCode,
        credits: dto.credits,
        description: dto.description,
        status: dto.status ?? 'active',
        institutionId,
        academicYearId,
        departmentId,
        classId,
      },
    });
  }

  async findAllSubjects(institutionId: string, filters?: { academicYearId?: string; departmentId?: string; classId?: string }) {
    const where: any = { institutionId };
    if (filters?.academicYearId) where.academicYearId = filters.academicYearId;
    if (filters?.departmentId) where.departmentId = filters.departmentId;
    if (filters?.classId) where.classId = filters.classId;
    return this.prisma.subject.findMany({ where, orderBy: { subjectName: 'asc' } });
  }

  async findSubjectById(institutionId: string, id: string) {
    const subject = await this.prisma.subject.findFirst({ where: { id, institutionId } });
    if (!subject) throw new NotFoundException('Subject not found');
    return subject;
  }

  async updateSubject(institutionId: string, id: string, dto: UpdateSubjectDto) {
    await this.findSubjectById(institutionId, id);
    return this.prisma.subject.update({ where: { id }, data: dto });
  }

  async removeSubject(institutionId: string, id: string) {
    await this.findSubjectById(institutionId, id);
    await this.prisma.subject.update({ where: { id }, data: { status: 'inactive' } });
    return { message: 'Subject deactivated successfully' };
  }
}
