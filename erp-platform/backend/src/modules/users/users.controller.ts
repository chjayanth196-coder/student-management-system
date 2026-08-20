import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('SuperAdmin', 'CollegeAdmin')
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @Roles('SuperAdmin', 'CollegeAdmin', 'Principal', 'HOD')
  async findAll(@Query('institutionId') institutionId?: string) {
    return this.usersService.findAll(institutionId);
  }

  @Get('me')
  async getProfile(@CurrentUser('id') id: string) {
    return this.usersService.findById(id);
  }

  @Get(':id')
  @Roles('SuperAdmin', 'CollegeAdmin', 'Principal', 'HOD')
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id')
  @Roles('SuperAdmin', 'CollegeAdmin')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles('SuperAdmin', 'CollegeAdmin')
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}

