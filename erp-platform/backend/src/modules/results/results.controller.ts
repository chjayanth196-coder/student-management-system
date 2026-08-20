import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ResultsService } from './results.service';
import { CreateResultDto } from './dto/create-result.dto';
import { UpdateResultDto } from './dto/update-result.dto';
import { QueryResultDto } from './dto/query-result.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('institutions/:institutionId/results')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin', 'Principal', 'Faculty')
  async create(
    @Param('institutionId') institutionId: string,
    @Body() dto: CreateResultDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.resultsService.create(institutionId, dto, userId);
  }

  @Get()
  async findAll(
    @Param('institutionId') institutionId: string,
    @Query() query: QueryResultDto,
  ) {
    return this.resultsService.findAll(institutionId, query);
  }

  @Get('student/:studentId')
  async getStudentReport(
    @Param('institutionId') institutionId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.resultsService.getStudentReport(institutionId, studentId);
  }

  @Get('class/:classId')
  async getClassResults(
    @Param('institutionId') institutionId: string,
    @Param('classId') classId: string,
    @Query('term') term?: string,
  ) {
    return this.resultsService.getClassResults(institutionId, classId, term);
  }

  @Get('gpa/:studentId')
  async getGpa(
    @Param('institutionId') institutionId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.resultsService.getGpa(institutionId, studentId);
  }

  @Get(':id')
  async findById(
    @Param('institutionId') institutionId: string,
    @Param('id') id: string,
  ) {
    return this.resultsService.findById(institutionId, id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin', 'Principal', 'Faculty')
  async update(
    @Param('institutionId') institutionId: string,
    @Param('id') id: string,
    @Body() dto: UpdateResultDto,
  ) {
    return this.resultsService.update(institutionId, id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin')
  async remove(
    @Param('institutionId') institutionId: string,
    @Param('id') id: string,
  ) {
    return this.resultsService.remove(institutionId, id);
  }
}
