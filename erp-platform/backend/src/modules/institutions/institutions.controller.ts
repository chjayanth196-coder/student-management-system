import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InstitutionsService } from './institutions.service';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('institutions')
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SuperAdmin')
  async create(@Body() dto: CreateInstitutionDto) {
    return this.institutionsService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query('q') q?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @CurrentUser() user?: any,
  ) {
    return this.institutionsService.findAll({ q, type, status }, user);
  }

  @Get('slug/:slug')
  @Public()
  async findBySlug(@Param('slug') slug: string) {
    return this.institutionsService.findBySlug(slug);
  }

@Get(':id')
  @UseGuards(JwtAuthGuard)
  async findById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.institutionsService.findById(id, user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInstitutionDto,
    @CurrentUser() user: any,
  ) {
    return this.institutionsService.update(id, dto, user);
  }

  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SuperAdmin')
  async toggleActive(@Param('id') id: string) {
    return this.institutionsService.toggleActive(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SuperAdmin')
  async remove(@Param('id') id: string) {
    return this.institutionsService.remove(id);
  }
}
