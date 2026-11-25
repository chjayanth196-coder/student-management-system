import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';

@Controller('institutions/:institutionId/exams')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin', 'Principal', 'HOD')
  async create(@Param('institutionId') institutionId: string, @Body() dto: CreateExamDto) {
    return this.examsService.create(institutionId, dto);
  }

  @Get()
  async findAll(
    @Param('institutionId') institutionId: string,
    @Query('classId') classId?: string,
    @Query('term') term?: string,
    @Query('examType') examType?: string,
  ) {
    return this.examsService.findAll(institutionId, { classId, term, examType });
  }

  @Get(':id')
  async findById(@Param('institutionId') institutionId: string, @Param('id') id: string) {
    return this.examsService.findById(institutionId, id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin', 'Principal', 'HOD')
  async update(
    @Param('institutionId') institutionId: string,
    @Param('id') id: string,
    @Body() dto: UpdateExamDto,
  ) {
    return this.examsService.update(institutionId, id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin', 'Principal', 'HOD')
  async remove(@Param('institutionId') institutionId: string, @Param('id') id: string) {
    return this.examsService.remove(institutionId, id);
  }
}
