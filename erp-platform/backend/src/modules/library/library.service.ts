import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class LibraryService {
  constructor(private readonly prisma: PrismaService) {}

  async createBook(institutionId: string, dto: {
    title: string; author: string; isbn?: string; publisher?: string;
    category?: string; quantity?: number; rackNo?: string; description?: string;
  }) {
    return this.prisma.libraryBook.create({
      data: {
        title: dto.title, author: dto.author, isbn: dto.isbn,
        publisher: dto.publisher, category: dto.category,
        quantity: dto.quantity || 1, available: dto.quantity || 1,
        rackNo: dto.rackNo, description: dto.description,
        institutionId,
      },
    });
  }

  async findAllBooks(institutionId: string, query?: { search?: string; category?: string; page?: number; limit?: number }) {
    const where: any = { institutionId };
    if (query?.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { author: { contains: query.search, mode: 'insensitive' } },
        { isbn: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query?.category) where.category = query.category;
    
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.libraryBook.findMany({ where, skip, take: limit, orderBy: { title: 'asc' } }),
      this.prisma.libraryBook.count({ where }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findBookById(institutionId: string, id: string) {
    const book = await this.prisma.libraryBook.findFirst({ where: { id, institutionId } });
    if (!book) throw new NotFoundException('Book not found');
    return book;
  }

  async updateBook(institutionId: string, id: string, dto: any) {
    await this.findBookById(institutionId, id);
    return this.prisma.libraryBook.update({ where: { id }, data: dto });
  }

  async deleteBook(institutionId: string, id: string) {
    await this.findBookById(institutionId, id);
    await this.prisma.libraryBook.delete({ where: { id } });
    return { message: 'Book deleted successfully' };
  }
}
