import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin/dashboard')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin')
  async getSuperAdminDashboard() {
    return this.dashboardService.getSuperAdminDashboard();
  }

  @Get('institutions/:institutionId/dashboard')
  @UseGuards(TenantGuard)
  async getAdminDashboard(@Param('institutionId') institutionId: string) {
    return this.dashboardService.getAdminDashboard(institutionId);
  }

  @Get('institutions/:institutionId/dashboard/student')
  @UseGuards(TenantGuard)
  async getStudentDashboard(
    @Param('institutionId') institutionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.dashboardService.getStudentDashboard(institutionId, userId);
  }

  @Get('institutions/:institutionId/dashboard/faculty')
  @UseGuards(TenantGuard)
  async getFacultyDashboard(
    @Param('institutionId') institutionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.dashboardService.getFacultyDashboard(institutionId, userId);
  }
}

