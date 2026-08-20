import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PlacementService } from './placement.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';

@Controller('institutions/:institutionId/placement')
@UseGuards(JwtAuthGuard, TenantGuard)
export class PlacementController {
  constructor(private readonly placementService: PlacementService) {}

  @Post('drives')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin', 'PlacementOfficer')
  async createDrive(@Param('institutionId') institutionId: string, @Body() dto: any) {
    return this.placementService.createDrive(institutionId, dto);
  }

  @Get('drives')
  async findAllDrives(
    @Param('institutionId') institutionId: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.placementService.findAllDrives(institutionId, {
      status, page: page ? parseInt(page) : 1, limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('drives/:id')
  async findDriveById(@Param('institutionId') institutionId: string, @Param('id') id: string) {
    return this.placementService.findDriveById(institutionId, id);
  }

  @Put('drives/:id')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin', 'PlacementOfficer')
  async updateDrive(@Param('institutionId') institutionId: string, @Param('id') id: string, @Body() dto: any) {
    return this.placementService.updateDrive(institutionId, id, dto);
  }

  @Delete('drives/:id')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin', 'PlacementOfficer')
  async deleteDrive(@Param('institutionId') institutionId: string, @Param('id') id: string) {
    return this.placementService.deleteDrive(institutionId, id);
  }

  @Post('applications')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin', 'PlacementOfficer', 'Student')
  async applyForDrive(@Param('institutionId') institutionId: string, @Body() dto: any) {
    return this.placementService.applyForDrive(institutionId, dto);
  }

  @Get('applications')
  async findAllApplications(
    @Param('institutionId') institutionId: string,
    @Query('driveId') driveId?: string,
    @Query('status') status?: string,
  ) {
    return this.placementService.findAllApplications(institutionId, { driveId, status });
  }

  @Get('applications/:id')
  async findApplicationById(@Param('institutionId') institutionId: string, @Param('id') id: string) {
    return this.placementService.findApplicationById(institutionId, id);
  }

  @Put('applications/:id/status')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin', 'PlacementOfficer')
  async updateApplicationStatus(@Param('institutionId') institutionId: string, @Param('id') id: string, @Body() dto: any) {
    return this.placementService.updateApplicationStatus(institutionId, id, dto);
  }
}
