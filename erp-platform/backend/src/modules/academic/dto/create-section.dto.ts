import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateSectionDto {
  @IsString()
  sectionName: string;

  @IsOptional()
  @IsString()
  roomNumber?: string;

  @IsOptional()
  @IsNumber()
  capacity?: number;

  @IsOptional()
  @IsString()
  status?: string;
}
