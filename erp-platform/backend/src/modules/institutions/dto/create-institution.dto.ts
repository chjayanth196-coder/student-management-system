import { IsString, IsEmail, IsEnum, IsOptional, IsBoolean, IsObject, MinLength } from 'class-validator';

export enum InstitutionType {
  School = 'School',
  College = 'College',
  University = 'University',
  Other = 'Other',
}

export class CreateInstitutionDto {
  @IsString()
  name: string;

  @IsEnum(InstitutionType)
  type: InstitutionType;

  @IsOptional()
  @IsString()
  @MinLength(2)
  adminName?: string;

  @IsOptional()
  @IsEmail()
  adminEmail?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  adminPassword?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  principal?: string;

  @IsOptional()
  @IsString()
  academicYear?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  colors?: Record<string, any>;

  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}
