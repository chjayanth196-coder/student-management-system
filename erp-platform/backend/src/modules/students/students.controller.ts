import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';

@Controller('institutions/:institutionId/students')
@UseGuards(JwtAuthGuard, TenantGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin', 'Principal')
  async create(@Param('institutionId') institutionId: string, @Body() dto: CreateStudentDto) {
    return this.studentsService.create(institutionId, dto);
  }

  @Get()
  async findAll(
    @Param('institutionId') institutionId: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.studentsService.findAll(institutionId, {
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get(':id')
  async findById(@Param('institutionId') institutionId: string, @Param('id') id: string) {
    return this.studentsService.findById(institutionId, id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin', 'Principal')
  async update(
    @Param('institutionId') institutionId: string,
    @Param('id') id: string,
    @Body() dto: UpdateStudentDto,
  ) {
    return this.studentsService.update(institutionId, id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin')
  async remove(@Param('institutionId') institutionId: string, @Param('id') id: string) {
    return this.studentsService.remove(institutionId, id);
  }
}
