import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateClassDto {
  @IsOptional()
  @IsString()
  className?: string;

  @IsOptional()
  @IsString()
  classCode?: string;

  @IsOptional()
  @IsString()
  semesterOrGrade?: string;

  @IsOptional()
  @IsNumber()
  capacity?: number;

  @IsOptional()
  @IsString()
  status?: string;
}
