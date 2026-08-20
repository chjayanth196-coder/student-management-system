import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('superadmin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SuperAdmin')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  async getPlatformAnalytics() {
    return this.analyticsService.getPlatformAnalytics();
  }

  @Get('comparison')
  async getComparison(@Query('ids') ids?: string) {
    const idList = ids ? ids.split(',') : [];
    return this.analyticsService.getComparison(idList);
  }

  @Get(':institutionId')
  async getInstitutionAnalytics(@Param('institutionId') institutionId: string) {
    return this.analyticsService.getInstitutionAnalytics(institutionId);
  }
}
