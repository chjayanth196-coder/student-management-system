import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean, Min } from 'class-validator';

export enum FeeFrequency {
  Monthly = 'Monthly',
  Quarterly = 'Quarterly',
  Yearly = 'Yearly',
  OneTime = 'OneTime',
}

export enum FeeCategory {
  Tuition = 'Tuition',
  Library = 'Library',
  Laboratory = 'Laboratory',
  Sports = 'Sports',
  Hostel = 'Hostel',
  Transport = 'Transport',
  Examination = 'Examination',
  Admission = 'Admission',
  Development = 'Development',
  Other = 'Other',
}

export class CreateFeeStructureDto {
  @IsString()
  name: string;

  @IsEnum(FeeCategory)
  category: FeeCategory;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(FeeFrequency)
  frequency: FeeFrequency;

  @IsOptional()
  @IsNumber()
  dueDay?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lateFee?: number;

  @IsOptional()
  @IsBoolean()
  isOptional?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}

