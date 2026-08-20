import { IsString, IsEmail, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class UpdateStudentDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsString() dob?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() rollNo?: string;
  @IsOptional() @IsString() enrollmentNo?: string;
  @IsOptional() @IsString() className?: string;
  @IsOptional() @IsString() section?: string;
  @IsOptional() @IsString() parentName?: string;
  @IsOptional() @IsString() parentPhone?: string;
  @IsOptional() @IsNumber() admissionYear?: number;
  @IsOptional() @IsNumber() semester?: number;
  @IsOptional() @IsString() avatar?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
