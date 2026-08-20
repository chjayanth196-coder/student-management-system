import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateClassDto {
  @IsString()
  className: string;

  @IsString()
  classCode: string;

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
