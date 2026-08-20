import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { FeesService } from './fees.service';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';
import { UpdateFeeStructureDto } from './dto/update-fee-structure.dto';
import { CreateFeePaymentDto } from './dto/create-fee-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';

@Controller('institutions/:institutionId/fees')
@UseGuards(JwtAuthGuard, TenantGuard)
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  // ========================
  // FEE STRUCTURE ENDPOINTS
  // ========================

  @Post('structures')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin', 'Accountant')
  async createStructure(
    @Param('institutionId') institutionId: string,
    @Body() dto: CreateFeeStructureDto,
  ) {
    return this.feesService.createStructure(institutionId, dto);
  }

  @Get('structures')
  async findAllStructures(
    @Param('institutionId') institutionId: string,
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.feesService.findAllStructures(institutionId, { category, isActive });
  }

  @Get('structures/:id')
  async findStructureById(
    @Param('institutionId') institutionId: string,
    @Param('id') id: string,
  ) {
    return this.feesService.findStructureById(institutionId, id);
  }

  @Put('structures/:id')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin', 'Accountant')
  async updateStructure(
    @Param('institutionId') institutionId: string,
    @Param('id') id: string,
    @Body() dto: UpdateFeeStructureDto,
  ) {
    return this.feesService.updateStructure(institutionId, id, dto);
  }

  @Delete('structures/:id')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin')
  async removeStructure(
    @Param('institutionId') institutionId: string,
    @Param('id') id: string,
  ) {
    return this.feesService.removeStructure(institutionId, id);
  }

  // ========================
  // FEE PAYMENT ENDPOINTS
  // ========================

  @Post('payments')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin', 'Accountant')
  async createPayment(
    @Param('institutionId') institutionId: string,
    @Body() dto: CreateFeePaymentDto,
  ) {
    return this.feesService.createPayment(institutionId, dto);
  }

  @Get('payments')
  async findAllPayments(
    @Param('institutionId') institutionId: string,
    @Query('studentId') studentId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.feesService.findAllPayments(institutionId, {
      studentId, status, startDate, endDate,
      page: page ? +page : 1,
      limit: limit ? +limit : 20,
    });
  }

  @Get('payments/:id')
  async findPaymentById(
    @Param('institutionId') institutionId: string,
    @Param('id') id: string,
  ) {
    return this.feesService.findPaymentById(institutionId, id);
  }

  @Patch('payments/:id/status')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin', 'Accountant')
  async updatePaymentStatus(
    @Param('institutionId') institutionId: string,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.feesService.updatePaymentStatus(institutionId, id, status);
  }

  @Get('student/:studentId')
  async getStudentFeeSummary(
    @Param('institutionId') institutionId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.feesService.getStudentFeeSummary(institutionId, studentId);
  }

  @Get('reports/collection')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin', 'Accountant', 'Principal')
  async getCollectionReport(
    @Param('institutionId') institutionId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.feesService.getCollectionReport(institutionId, { startDate, endDate });
  }
}

