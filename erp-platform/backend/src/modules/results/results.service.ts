import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateResultDto } from './dto/create-result.dto';
import { UpdateResultDto } from './dto/update-result.dto';
import { QueryResultDto } from './dto/query-result.dto';

@Injectable()
export class ResultsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(institutionId: string, dto: CreateResultDto, userId: string) {
    const student = await this.prisma.user.findFirst({
      where: { id: dto.studentId, role: 'Student', institutionId },
    });
    if (!student) throw new NotFoundException('Student not found in this institution');

    const subject = await this.prisma.subject.findFirst({
      where: { id: dto.subjectId, institutionId },
    });
    if (!subject) throw new NotFoundException('Subject not found');

    const existing = await this.prisma.result.findFirst({
      where: {
        studentId: dto.studentId,
        term: dto.term,
        examType: dto.examType,
        subjectId: dto.subjectId,
      },
    });
    if (existing) {
      throw new ConflictException('Result already exists for this student/subject/term/exam type');
    }

    const percentage = dto.percentage ?? (dto.maxMarks > 0 ? Number(((dto.marksObtained / dto.maxMarks) * 100).toFixed(2)) : 0);
    const grade = dto.grade ?? this.calculateGrade(percentage);

    return this.prisma.result.create({
      data: {
        studentId: dto.studentId,
        subjectId: dto.subjectId,
        academicYearId: dto.academicYearId,
        examType: dto.examType,
        term: dto.term,
        marksObtained: dto.marksObtained,
        maxMarks: dto.maxMarks,
        percentage,
        grade,
        remarks: dto.remarks,
        createdBy: userId,
        institutionId,
      },
    });
  }

  async findAll(institutionId: string, query?: QueryResultDto) {
    const where: any = { institutionId };

    if (query?.studentId) where.studentId = query.studentId;
    if (query?.subjectId) where.subjectId = query.subjectId;
    if (query?.academicYearId) where.academicYearId = query.academicYearId;
    if (query?.classId) where.classId = query.classId;
    if (query?.term) where.term = query.term;
    if (query?.examType) where.examType = query.examType;

    const results = await this.prisma.result.findMany({
      where,
      include: {
        student: {
          select: { id: true, name: true, rollNo: true, enrollmentNo: true },
        },
        subject: {
          select: { id: true, subjectName: true, subjectCode: true, credits: true },
        },
      },
      orderBy: [{ term: 'asc' }, { examType: 'asc' }],
    });

    return results;
  }

  async findById(institutionId: string, id: string) {
    const result = await this.prisma.result.findFirst({
      where: { id, institutionId },
      include: {
        student: {
          select: { id: true, name: true, rollNo: true, enrollmentNo: true, className: true, section: true },
        },
        subject: {
          select: { id: true, subjectName: true, subjectCode: true, credits: true },
        },
      },
    });
    if (!result) throw new NotFoundException('Result not found');
    return result;
  }

  async update(institutionId: string, id: string, dto: UpdateResultDto) {
    const result = await this.findById(institutionId, id);

    const updateData: any = { ...dto };
    if (dto.marksObtained !== undefined || dto.maxMarks !== undefined) {
      const marksObtained = dto.marksObtained ?? result.marksObtained;
      const maxMarks = dto.maxMarks ?? result.maxMarks;
      updateData.percentage = maxMarks > 0 ? Number(((marksObtained / maxMarks) * 100).toFixed(2)) : 0;
      if (!dto.grade) {
        updateData.grade = this.calculateGrade(updateData.percentage);
      }
    }

    return this.prisma.result.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(institutionId: string, id: string) {
    await this.findById(institutionId, id);
    await this.prisma.result.delete({ where: { id } });
    return { message: 'Result deleted successfully' };
  }

  async getStudentReport(institutionId: string, studentId: string) {
    const student = await this.prisma.user.findFirst({
      where: { id: studentId, role: 'Student', institutionId },
    });
    if (!student) throw new NotFoundException('Student not found');

    const results = await this.prisma.result.findMany({
      where: { studentId, institutionId },
      include: {
        subject: {
          select: { id: true, subjectName: true, subjectCode: true, credits: true },
        },
      },
      orderBy: [{ term: 'asc' }, { examType: 'asc' }],
    });

    const termMap = new Map<string, any[]>();
    for (const r of results) {
      if (!termMap.has(r.term)) termMap.set(r.term, []);
      termMap.get(r.term)!.push(r);
    }

    const terms: any[] = [];
    let totalPercentage = 0;
    let totalSubjects = 0;

    for (const [term, termResults] of termMap) {
      const termPercentage = termResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / termResults.length;
      const termGrade = this.calculateGrade(termPercentage);
      terms.push({
        term,
        results: termResults,
        totalMarks: termResults.reduce((sum, r) => sum + r.marksObtained, 0),
        maxMarks: termResults.reduce((sum, r) => sum + r.maxMarks, 0),
        percentage: Number(termPercentage.toFixed(2)),
        grade: termGrade,
      });
      totalPercentage += termPercentage;
      totalSubjects += termResults.length;
    }

    const overallPercentage = totalSubjects > 0 ? Number((totalPercentage / terms.length).toFixed(2)) : 0;

    return {
      student: {
        id: student.id,
        name: student.name,
        rollNo: student.rollNo,
        className: student.className,
        section: student.section,
      },
      terms,
      summary: {
        totalTerms: terms.length,
        totalSubjects,
        overallPercentage,
        overallGrade: this.calculateGrade(overallPercentage),
      },
    };
  }

  async getClassResults(institutionId: string, classId: string, term?: string) {
    const where: any = { institutionId, classId };
    if (term) where.term = term;

    const results = await this.prisma.result.findMany({
      where,
      include: {
        student: {
          select: { id: true, name: true, rollNo: true },
        },
        subject: {
          select: { id: true, subjectName: true, subjectCode: true, credits: true },
        },
      },
      orderBy: [{ student: { name: 'asc' } }, { subject: { subjectName: 'asc' } }],
    });

    return results;
  }

  async getGpa(institutionId: string, studentId: string) {
    const student = await this.prisma.user.findFirst({
      where: { id: studentId, role: 'Student', institutionId },
    });
    if (!student) throw new NotFoundException('Student not found');

    const results = await this.prisma.result.findMany({
      where: { studentId, institutionId },
      include: { subject: { select: { credits: true } } },
    });

    if (results.length === 0) {
      return { gpa: 0, totalCredits: 0, earnedCredits: 0, totalMarks: 0, obtainedMarks: 0, percentage: 0 };
    }

    let totalGradePoints = 0;
    let totalCredits = 0;
    let totalMarks = 0;
    let obtainedMarks = 0;

    for (const r of results) {
      const credits = r.subject?.credits || 1;
      totalCredits += credits;
      totalMarks += r.maxMarks;
      obtainedMarks += r.marksObtained;
      const pct = r.percentage ?? (r.maxMarks > 0 ? (r.marksObtained / r.maxMarks) * 100 : 0);
      let gradePoint = 0;
      if (pct >= 90) gradePoint = 10;
      else if (pct >= 80) gradePoint = 9;
      else if (pct >= 70) gradePoint = 8;
      else if (pct >= 60) gradePoint = 7;
      else if (pct >= 50) gradePoint = 6;
      else if (pct >= 40) gradePoint = 5;
      else gradePoint = 0;
      totalGradePoints += gradePoint * credits;
    }

    const gpa = totalCredits > 0 ? Number((totalGradePoints / totalCredits).toFixed(2)) : 0;
    const percentage = totalMarks > 0 ? Number(((obtainedMarks / totalMarks) * 100).toFixed(2)) : 0;

    return { gpa, totalCredits, earnedCredits: totalCredits, totalMarks, obtainedMarks, percentage };
  }

  private calculateGrade(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  }
}
