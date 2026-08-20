import { IsString, IsEmail, IsOptional, IsEnum, IsArray, IsBoolean, IsNumber } from 'class-validator';

export class CreateStaffDto {
  @IsString() firstName: string;
  @IsString() lastName: string;
  @IsEmail() email: string;
  @IsString() password: string;
  @IsString() staffType: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsString() dob?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() qualification?: string;
  @IsOptional() @IsString() specialization?: string;
  @IsOptional() @IsNumber() experience?: number;
  @IsOptional() @IsString() joiningDate?: string;
  @IsOptional() @IsString() designation?: string;
  @IsOptional() @IsString() departmentId?: string;
  @IsOptional() @IsString() assignedClassId?: string;
  @IsOptional() @IsString() assignedSectionId?: string;
  @IsOptional() @IsArray() assignedSubjectIds?: string[];
  @IsOptional() @IsBoolean() classTeacher?: boolean;
  @IsOptional() @IsNumber() salary?: number;
}

