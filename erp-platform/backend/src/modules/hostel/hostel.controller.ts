import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { HostelService } from './hostel.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';

@Controller('institutions/:institutionId/hostel')
@UseGuards(JwtAuthGuard, TenantGuard)
export class HostelController {
  constructor(private readonly hostelService: HostelService) {}

  @Post('rooms')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin', 'HostelWarden')
  async createRoom(@Param('institutionId') institutionId: string, @Body() dto: any) {
    return this.hostelService.createRoom(institutionId, dto);
  }

  @Get('rooms')
  async findAllRooms(
    @Param('institutionId') institutionId: string,
    @Query('hostelName') hostelName?: string,
    @Query('roomType') roomType?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.hostelService.findAllRooms(institutionId, { hostelName, roomType, page: page ? parseInt(page) : 1, limit: limit ? parseInt(limit) : 20 });
  }

  @Get('rooms/:id')
  async findRoomById(@Param('institutionId') institutionId: string, @Param('id') id: string) {
    return this.hostelService.findRoomById(institutionId, id);
  }

  @Put('rooms/:id')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin', 'HostelWarden')
  async updateRoom(@Param('institutionId') institutionId: string, @Param('id') id: string, @Body() dto: any) {
    return this.hostelService.updateRoom(institutionId, id, dto);
  }

  @Delete('rooms/:id')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin', 'HostelWarden')
  async deleteRoom(@Param('institutionId') institutionId: string, @Param('id') id: string) {
    return this.hostelService.deleteRoom(institutionId, id);
  }

  @Post('allocate')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin', 'HostelWarden')
  async allocateRoom(@Param('institutionId') institutionId: string, @Body() dto: any) {
    return this.hostelService.allocateRoom(institutionId, dto);
  }

  @Post('deallocate/:allocationId')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin', 'HostelWarden')
  async deallocateRoom(@Param('institutionId') institutionId: string, @Param('allocationId') allocationId: string) {
    return this.hostelService.deallocateRoom(institutionId, allocationId);
  }

  @Get('allocations')
  async getAllocations(@Param('institutionId') institutionId: string, @Query('status') status?: string, @Query('hostelName') hostelName?: string) {
    return this.hostelService.getAllocations(institutionId, { status, hostelName });
  }
}
