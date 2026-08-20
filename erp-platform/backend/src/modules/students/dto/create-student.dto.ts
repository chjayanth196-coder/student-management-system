import { IsString, IsEmail, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { Gender } from '@prisma/client';

export class CreateStudentDto {
  @IsString() name: string;
  @IsEmail() email: string;
  @IsString() password: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEnum(Gender) gender?: Gender;
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
}

