import { IsString, IsNumber, IsEnum, IsOptional, IsDateString, Min } from 'class-validator';

export enum PaymentStatus {
  Pending = 'Pending',
  Paid = 'Paid',
  Overdue = 'Overdue',
  Partial = 'Partial',
  Cancelled = 'Cancelled',
}

export enum PaymentMode {
  Cash = 'Cash',
  Cheque = 'Cheque',
  BankTransfer = 'BankTransfer',
  Card = 'Card',
  Online = 'Online',
}

export class CreateFeePaymentDto {
  @IsString()
  studentId: string;

  @IsOptional()
  @IsString()
  feeStructureId?: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsNumber()
  @Min(0)
  paidAmount: number;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsDateString()
  paidDate?: string;

  @IsOptional()
  @IsEnum(PaymentMode)
  paymentMode?: PaymentMode;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsString()
  receiptNo?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fine?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}

