import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';

@Controller('institutions/:institutionId/staff')
@UseGuards(JwtAuthGuard, TenantGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin', 'Principal')
  async create(@Param('institutionId') institutionId: string, @Body() dto: CreateStaffDto) {
    return this.staffService.create(institutionId, dto);
  }

  @Get()
  async findAll(
    @Param('institutionId') institutionId: string,
    @Query('search') search?: string,
    @Query('staffType') staffType?: string,
    @Query('status') status?: string,
    @Query('departmentId') departmentId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.staffService.findAll(institutionId, {
      search,
      staffType,
      status,
      departmentId,
      page: page ? +page : 1,
      limit: limit ? +limit : 20,
    });
  }

  @Get(':id')
  async findById(@Param('institutionId') institutionId: string, @Param('id') id: string) {
    return this.staffService.findById(institutionId, id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin', 'Principal')
  async update(@Param('institutionId') institutionId: string, @Param('id') id: string, @Body() dto: UpdateStaffDto) {
    return this.staffService.update(institutionId, id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin')
  async remove(@Param('institutionId') institutionId: string, @Param('id') id: string) {
    return this.staffService.remove(institutionId, id);
  }

  @Patch(':id/toggle')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin')
  async toggleStatus(@Param('institutionId') institutionId: string, @Param('id') id: string, @Body('status') status: string) {
    return this.staffService.toggleStatus(institutionId, id, status);
  }

  @Post(':id/reset-password')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin')
  async resetPassword(@Param('institutionId') institutionId: string, @Param('id') id: string, @Body('newPassword') newPassword: string) {
    return this.staffService.resetPassword(institutionId, id, newPassword);
  }
}
