import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  subjectName: string;

  @IsString()
  subjectCode: string;

  @IsOptional()
  @IsNumber()
  credits?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
