import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';

@Injectable()
export class ExamsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(institutionId: string, dto: CreateExamDto) {
    const subject = await this.prisma.subject.findFirst({
      where: { id: dto.subjectId, institutionId },
    });
    if (!subject) throw new NotFoundException('Subject not found');

    const existing = await this.prisma.examSchedule.findUnique({
      where: {
        institutionId_subjectId_examType_term: {
          institutionId,
          subjectId: dto.subjectId,
          examType: dto.examType,
          term: dto.term,
        },
      },
    });
    if (existing) {
      throw new ConflictException('An exam already exists for this subject/exam type/term');
    }

    return this.prisma.examSchedule.create({
      data: {
        examName: dto.examName,
        examType: dto.examType,
        term: dto.term,
        subjectId: dto.subjectId,
        classId: dto.classId,
        academicYearId: dto.academicYearId,
        date: new Date(dto.date),
        startTime: dto.startTime,
        endTime: dto.endTime,
        roomNumber: dto.roomNumber,
        maxMarks: dto.maxMarks,
        description: dto.description,
        institutionId,
      },
      include: {
        subject: { select: { id: true, subjectName: true, subjectCode: true } },
        class: { select: { id: true, className: true, classCode: true } },
      },
    });
  }

  async findAll(
    institutionId: string,
    filters?: { classId?: string; term?: string; examType?: string },
  ) {
    const where: any = { institutionId };
    if (filters?.classId) where.classId = filters.classId;
    if (filters?.term) where.term = filters.term;
    if (filters?.examType) where.examType = filters.examType;
    return this.prisma.examSchedule.findMany({
      where,
      include: {
        subject: { select: { id: true, subjectName: true, subjectCode: true } },
        class: { select: { id: true, className: true, classCode: true } },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  async findById(institutionId: string, id: string) {
    const exam = await this.prisma.examSchedule.findFirst({
      where: { id, institutionId },
      include: {
        subject: { select: { id: true, subjectName: true, subjectCode: true } },
        class: { select: { id: true, className: true, classCode: true } },
      },
    });
    if (!exam) throw new NotFoundException('Exam not found');
    return exam;
  }

  async update(institutionId: string, id: string, dto: UpdateExamDto) {
    await this.findById(institutionId, id);
    const data: any = { ...dto };
    if (dto.date) data.date = new Date(dto.date);
    return this.prisma.examSchedule.update({
      where: { id },
      data,
      include: {
        subject: { select: { id: true, subjectName: true, subjectCode: true } },
        class: { select: { id: true, className: true, classCode: true } },
      },
    });
  }

  async remove(institutionId: string, id: string) {
    await this.findById(institutionId, id);
    await this.prisma.examSchedule.delete({ where: { id } });
    return { message: 'Exam deleted successfully' };
  }
}
