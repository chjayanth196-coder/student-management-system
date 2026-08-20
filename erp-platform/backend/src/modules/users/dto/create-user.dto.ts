import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsBoolean,
} from 'class-validator';

export enum UserRole {
  SuperAdmin = 'SuperAdmin',
  CollegeAdmin = 'CollegeAdmin',
  Principal = 'Principal',
  VicePrincipal = 'VicePrincipal',
  HOD = 'HOD',
  Faculty = 'Faculty',
  LabFaculty = 'LabFaculty',
  Accountant = 'Accountant',
  Librarian = 'Librarian',
  HostelWarden = 'HostelWarden',
  TransportManager = 'TransportManager',
  PlacementOfficer = 'PlacementOfficer',
  Parent = 'Parent',
  Student = 'Student',
  Alumni = 'Alumni',
  Guest = 'Guest',
}

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  institutionId?: string;

  @IsOptional()
  @IsString()
  rollNo?: string;

  @IsOptional()
  @IsString()
  enrollmentNo?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

