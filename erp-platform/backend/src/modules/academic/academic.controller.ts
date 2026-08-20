import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AcademicService } from './academic.service';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';

@Controller('institutions/:institutionId')
@UseGuards(JwtAuthGuard, TenantGuard)
export class AcademicController {
  constructor(private readonly academicService: AcademicService) {}

  @Post('academic-years')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'CollegeAdmin')
  async createAcademicYear(@Param('institutionId') institutionId: string, @Body() dto: CreateAcademicYearDto) {
    return this.academicService.createAcademicYear(institutionId, dto);
  }

  @Get('academic-years')
  async findAllAcademicYears(@Param('institutionId') institutionId: string, @Query('q') q?: string, @Query('status') status?: string) {
    return this.academicService.findAllAcademicYears(institutionId, { q, status });
  }

  @Get('academic-years/:id')
  async findAcademicYearById(@Param('institutionId') institutionId: string, @Param('id') id: string) {
    return this.academicService.findAcademicYearById(institutionId, id);
  }

  @Put('academic-years/:id')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'CollegeAdmin')
  async updateAcademicYear(@Param('institutionId') institutionId: string, @Param('id') id: string, @Body() dto: UpdateAcademicYearDto) {
    return this.academicService.updateAcademicYear(institutionId, id, dto);
  }

  @Post('departments')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'CollegeAdmin', 'Principal')
  async createDepartment(@Param('institutionId') institutionId: string, @Query('academicYearId') academicYearId: string, @Body() dto: CreateDepartmentDto) {
    if (!academicYearId) {
      const years = await this.academicService.findAllAcademicYears(institutionId, { status: 'active' });
      const current = years.find(y => y.isCurrent) || years[0];
      if (!current) throw new Error('No academic year found. Create one first.');
      academicYearId = current.id;
    }
    return this.academicService.createDepartment(institutionId, academicYearId, dto);
  }

  @Get('departments')
  async findAllDepartments(@Param('institutionId') institutionId: string, @Query('academicYearId') academicYearId?: string) {
    return this.academicService.findAllDepartments(institutionId, academicYearId);
  }

  @Get('departments/:id')
  async findDepartmentById(@Param('institutionId') institutionId: string, @Param('id') id: string) {
    return this.academicService.findDepartmentById(institutionId, id);
  }

  @Put('departments/:id')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'CollegeAdmin', 'Principal')
  async updateDepartment(@Param('institutionId') institutionId: string, @Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.academicService.updateDepartment(institutionId, id, dto);
  }

  @Delete('departments/:id')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'CollegeAdmin')
  async removeDepartment(@Param('institutionId') institutionId: string, @Param('id') id: string) {
    return this.academicService.removeDepartment(institutionId, id);
  }

  @Post('classes')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'CollegeAdmin', 'Principal')
  async createClass(@Param('institutionId') institutionId: string, @Query('academicYearId') academicYearId: string, @Query('departmentId') departmentId: string, @Body() dto: CreateClassDto) {
    if (!academicYearId || !departmentId) throw new Error('academicYearId and departmentId are required');
    return this.academicService.createClass(institutionId, academicYearId, departmentId, dto);
  }

  @Get('classes')
  async findAllClasses(@Param('institutionId') institutionId: string, @Query('academicYearId') academicYearId?: string, @Query('departmentId') departmentId?: string) {
    return this.academicService.findAllClasses(institutionId, { academicYearId, departmentId });
  }

  @Get('classes/:id')
  async findClassById(@Param('institutionId') institutionId: string, @Param('id') id: string) {
    return this.academicService.findClassById(institutionId, id);
  }

  @Put('classes/:id')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'CollegeAdmin', 'Principal')
  async updateClass(@Param('institutionId') institutionId: string, @Param('id') id: string, @Body() dto: UpdateClassDto) {
    return this.academicService.updateClass(institutionId, id, dto);
  }

  @Delete('classes/:id')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'CollegeAdmin')
  async removeClass(@Param('institutionId') institutionId: string, @Param('id') id: string) {
    return this.academicService.removeClass(institutionId, id);
  }

  @Post('sections')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'CollegeAdmin', 'Principal')
  async createSection(@Param('institutionId') institutionId: string, @Query('classId') classId: string, @Body() dto: CreateSectionDto) {
    if (!classId) throw new Error('classId is required');
    return this.academicService.createSection(institutionId, classId, dto);
  }

  @Get('sections')
  async findAllSections(@Param('institutionId') institutionId: string, @Query('classId') classId?: string) {
    return this.academicService.findAllSections(institutionId, classId);
  }

  @Get('sections/:id')
  async findSectionById(@Param('institutionId') institutionId: string, @Param('id') id: string) {
    return this.academicService.findSectionById(institutionId, id);
  }

  @Put('sections/:id')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'CollegeAdmin', 'Principal')
  async updateSection(@Param('institutionId') institutionId: string, @Param('id') id: string, @Body() dto: UpdateSectionDto) {
    return this.academicService.updateSection(institutionId, id, dto);
  }

  @Delete('sections/:id')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'CollegeAdmin')
  async removeSection(@Param('institutionId') institutionId: string, @Param('id') id: string) {
    return this.academicService.removeSection(institutionId, id);
  }

  @Post('subjects')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'CollegeAdmin', 'Principal', 'HOD')
  async createSubject(@Param('institutionId') institutionId: string, @Query('academicYearId') academicYearId: string, @Query('departmentId') departmentId: string, @Query('classId') classId: string, @Body() dto: CreateSubjectDto) {
    if (!academicYearId || !departmentId || !classId) throw new Error('academicYearId, departmentId, and classId are required');
    return this.academicService.createSubject(institutionId, academicYearId, departmentId, classId, dto);
  }

  @Get('subjects')
  async findAllSubjects(@Param('institutionId') institutionId: string, @Query('academicYearId') academicYearId?: string, @Query('departmentId') departmentId?: string, @Query('classId') classId?: string) {
    return this.academicService.findAllSubjects(institutionId, { academicYearId, departmentId, classId });
  }

  @Get('subjects/:id')
  async findSubjectById(@Param('institutionId') institutionId: string, @Param('id') id: string) {
    return this.academicService.findSubjectById(institutionId, id);
  }

  @Put('subjects/:id')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'CollegeAdmin', 'Principal', 'HOD')
  async updateSubject(@Param('institutionId') institutionId: string, @Param('id') id: string, @Body() dto: UpdateSubjectDto) {
    return this.academicService.updateSubject(institutionId, id, dto);
  }

  @Delete('subjects/:id')
  @UseGuards(RolesGuard) @Roles('SuperAdmin', 'CollegeAdmin')
  async removeSubject(@Param('institutionId') institutionId: string, @Param('id') id: string) {
    return this.academicService.removeSubject(institutionId, id);
  }
}
