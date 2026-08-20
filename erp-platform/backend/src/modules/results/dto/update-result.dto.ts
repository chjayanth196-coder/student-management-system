import { IsOptional, IsString, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { ExamType } from './create-result.dto';

export class UpdateResultDto {
  @IsOptional()
  @IsEnum(ExamType)
  examType?: ExamType;

  @IsOptional()
  @IsString()
  term?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  marksObtained?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxMarks?: number;

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

