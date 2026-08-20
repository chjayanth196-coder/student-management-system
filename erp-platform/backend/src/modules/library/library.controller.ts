import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LibraryService } from './library.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';

@Controller('institutions/:institutionId/library')
@UseGuards(JwtAuthGuard, TenantGuard)
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Post('books')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin', 'Librarian')
  async createBook(@Param('institutionId') institutionId: string, @Body() dto: any) {
    return this.libraryService.createBook(institutionId, dto);
  }

  @Get('books')
  async findAllBooks(
    @Param('institutionId') institutionId: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.libraryService.findAllBooks(institutionId, {
      search, category,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get('books/:id')
  async findBookById(@Param('institutionId') institutionId: string, @Param('id') id: string) {
    return this.libraryService.findBookById(institutionId, id);
  }

  @Put('books/:id')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin', 'Librarian')
  async updateBook(@Param('institutionId') institutionId: string, @Param('id') id: string, @Body() dto: any) {
    return this.libraryService.updateBook(institutionId, id, dto);
  }

  @Delete('books/:id')
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'CollegeAdmin', 'Librarian')
  async deleteBook(@Param('institutionId') institutionId: string, @Param('id') id: string) {
    return this.libraryService.deleteBook(institutionId, id);
  }
}
