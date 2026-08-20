import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TransportService } from './transport.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';

@Controller('institutions/:institutionId/transport')
@UseGuards(JwtAuthGuard, TenantGuard)
export class TransportController {
  constructor(private readonly transportService: TransportService) {}

  @Post('routes')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin', 'TransportManager')
  async createRoute(@Param('institutionId') institutionId: string, @Body() dto: any) {
    return this.transportService.createRoute(institutionId, dto);
  }

  @Get('routes')
  async findAllRoutes(
    @Param('institutionId') institutionId: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.transportService.findAllRoutes(institutionId, {
      search, page: page ? parseInt(page) : 1, limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('routes/:id')
  async findRouteById(@Param('institutionId') institutionId: string, @Param('id') id: string) {
    return this.transportService.findRouteById(institutionId, id);
  }

  @Put('routes/:id')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin', 'TransportManager')
  async updateRoute(@Param('institutionId') institutionId: string, @Param('id') id: string, @Body() dto: any) {
    return this.transportService.updateRoute(institutionId, id, dto);
  }

  @Delete('routes/:id')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin', 'TransportManager')
  async deleteRoute(@Param('institutionId') institutionId: string, @Param('id') id: string) {
    return this.transportService.deleteRoute(institutionId, id);
  }

  @Post('passes')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin', 'TransportManager')
  async issuePass(@Param('institutionId') institutionId: string, @Body() dto: any) {
    return this.transportService.issuePass(institutionId, dto);
  }

  @Get('passes')
  async findAllPasses(
    @Param('institutionId') institutionId: string,
    @Query('status') status?: string,
    @Query('routeId') routeId?: string,
  ) {
    return this.transportService.findAllPasses(institutionId, { status, routeId });
  }

  @Delete('passes/:id')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin', 'TransportManager')
  async cancelPass(@Param('institutionId') institutionId: string, @Param('id') id: string) {
    return this.transportService.cancelPass(institutionId, id);
  }
}
