import { IsString, IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class CreateExamDto {
  @IsString()
  examName: string;

  @IsString()
  examType: string;

  @IsString()
  term: string;

  @IsString()
  subjectId: string;

  @IsString()
  classId: string;

  @IsString()
  academicYearId: string;

  @IsDateString()
  date: string;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsOptional()
  @IsString()
  roomNumber?: string;

  @IsInt()
  @Min(1)
  maxMarks: number;

  @IsOptional()
  @IsString()
  description?: string;
}
