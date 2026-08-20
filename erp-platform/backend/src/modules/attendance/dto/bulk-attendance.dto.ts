import { IsString, IsDateString, IsEnum, IsArray, IsOptional } from 'class-validator';
import { AttendanceStatus } from './mark-attendance.dto';

export class BulkAttendanceItem {
  @IsString()
  studentId: string;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;
}

export class BulkAttendanceDto {
  @IsDateString()
  date: string;

  @IsArray()
  records: BulkAttendanceItem[];

  @IsOptional()
  @IsString()
  subjectId?: string;

  @IsOptional()
  @IsString()
  subjectName?: string;

  @IsOptional()
  @IsString()
  teacherId?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

