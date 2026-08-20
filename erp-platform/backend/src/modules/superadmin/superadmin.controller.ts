import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { SuperAdminService } from './superadmin.service';
import { VerifyPasswordDto } from './dto/verify-password.dto';
import { ResetAdminPasswordDto } from './dto/reset-admin-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('superadmin/colleges')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SuperAdmin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Post('verify-password')
  async verifyPassword(
    @CurrentUser('id') superAdminId: string,
    @Body() dto: VerifyPasswordDto,
  ) {
    return this.superAdminService.verifyOwnPassword(superAdminId, dto.password);
  }

  @Get('credentials')
  async getCollegeCredentials() {
    return this.superAdminService.getCollegeCredentials();
  }

  @Put(':institutionId/admin-password')
  async resetAdminPassword(
    @CurrentUser('id') superAdminId: string,
    @Param('institutionId') institutionId: string,
    @Body() dto: ResetAdminPasswordDto,
  ) {
    return this.superAdminService.resetAdminPassword(superAdminId, institutionId, dto.newPassword);
  }
}
