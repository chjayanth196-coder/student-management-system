import { IsString, IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';

export enum ExamType {
  Internal = 'Internal',
  MidSemester = 'MidSemester',
  Semester = 'Semester',
  Practical = 'Practical',
  Assignment = 'Assignment',
  Quiz = 'Quiz',
}

export class CreateResultDto {
  @IsString()
  studentId: string;

  @IsString()
  subjectId: string;

  @IsString()
  academicYearId: string;

  @IsEnum(ExamType)
  examType: ExamType;

  @IsString()
  term: string;

  @IsNumber()
  @Min(0)
  marksObtained: number;

  @IsNumber()
  @Min(0)
  maxMarks: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage?: number;

  @IsOptional()
  @IsString()
  grade?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

