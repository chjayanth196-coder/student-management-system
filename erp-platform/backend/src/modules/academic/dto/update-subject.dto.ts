import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateSubjectDto {
  @IsOptional()
  @IsString()
  subjectName?: string;

  @IsOptional()
  @IsString()
  subjectCode?: string;

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
