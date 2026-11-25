import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto, AttendanceStatus } from './dto/mark-attendance.dto';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('institutions/:institutionId/attendance')
@UseGuards(JwtAuthGuard, TenantGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('daily')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin', 'Principal', 'Faculty')
  async mark(
    @Param('institutionId') institutionId: string,
    @Query('sectionId') sectionId: string,
    @Query('subjectId') subjectId: string,
    @Body() dto: MarkAttendanceDto,
  ) {
    if (!sectionId || !subjectId) throw new Error('sectionId and subjectId are required');
    return this.attendanceService.mark(institutionId, sectionId, subjectId, dto);
  }

  @Post('daily/bulk')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin', 'Principal', 'Faculty')
  async markBulk(
    @Param('institutionId') institutionId: string,
    @Query('sectionId') sectionId: string,
    @Query('subjectId') subjectId: string,
    @Body() dto: BulkAttendanceDto,
  ) {
    if (!sectionId || !subjectId) throw new Error('sectionId and subjectId are required');
    return this.attendanceService.markBulk(institutionId, sectionId, subjectId, dto);
  }

  @Get('student/:studentId')
  async findByStudent(
    @Param('institutionId') institutionId: string,
    @Param('studentId') studentId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.attendanceService.findByStudent(institutionId, studentId, { startDate, endDate });
  }

  @Get('me')
  async getMyAttendance(
    @Param('institutionId') institutionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.attendanceService.getMyAttendance(institutionId, userId);
  }

  @Get('section/:sectionId')
  async findBySection(
    @Param('institutionId') institutionId: string,
    @Param('sectionId') sectionId: string,
    @Query('date') date?: string,
    @Query('subjectId') subjectId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.attendanceService.findBySection(institutionId, sectionId, {
      date,
      subjectId,
      startDate,
      endDate,
    });
  }

  @Get('report')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin', 'Principal', 'Faculty', 'HOD')
  async getSectionReport(
    @Param('institutionId') institutionId: string,
    @Query('sectionId') sectionId: string,
    @Query('subjectId') subjectId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (!sectionId) throw new Error('sectionId is required');
    return this.attendanceService.getSectionReport(institutionId, sectionId, {
      subjectId,
      startDate,
      endDate,
    });
  }

  @Get('overview')
  async getOverview(
    @Param('institutionId') institutionId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.attendanceService.getInstitutionOverview(institutionId, { startDate, endDate });
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin', 'Principal', 'Faculty')
  async update(@Param('institutionId') institutionId: string, @Param('id') id: string, @Body('status') status: AttendanceStatus) {
    return this.attendanceService.update(institutionId, id, status);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin')
  async remove(@Param('institutionId') institutionId: string, @Param('id') id: string) {
    return this.attendanceService.remove(institutionId, id);
  }
}
