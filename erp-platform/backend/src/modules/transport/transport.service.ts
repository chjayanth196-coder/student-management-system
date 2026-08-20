import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class TransportService {
  constructor(private readonly prisma: PrismaService) {}

  async createRoute(institutionId: string, dto: {
    routeName: string; startPoint: string; endPoint: string;
    busNo?: string; driverName?: string; driverPhone?: string;
    pickupTime?: string; dropTime?: string; fee?: number;
  }) {
    return this.prisma.transportRoute.create({ data: { ...dto, institutionId } });
  }

  async findAllRoutes(institutionId: string, query?: { search?: string; page?: number; limit?: number }) {
    const where: any = { institutionId };
    if (query?.search) {
      where.OR = [
        { routeName: { contains: query.search, mode: 'insensitive' } },
        { startPoint: { contains: query.search, mode: 'insensitive' } },
        { endPoint: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.transportRoute.findMany({ where, skip, take: limit, orderBy: { routeName: 'asc' } }),
      this.prisma.transportRoute.count({ where }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findRouteById(institutionId: string, id: string) {
    const route = await this.prisma.transportRoute.findFirst({ where: { id, institutionId } });
    if (!route) throw new NotFoundException('Route not found');
    return route;
  }

  async updateRoute(institutionId: string, id: string, dto: any) {
    await this.findRouteById(institutionId, id);
    return this.prisma.transportRoute.update({ where: { id }, data: dto });
  }

  async deleteRoute(institutionId: string, id: string) {
    await this.findRouteById(institutionId, id);
    await this.prisma.transportRoute.delete({ where: { id } });
    return { message: 'Route deleted successfully' };
  }

  async issuePass(institutionId: string, dto: {
    routeId: string; studentId: string; startDate: string; endDate: string; fee?: number;
  }) {
    const student = await this.prisma.user.findFirst({ where: { id: dto.studentId, role: 'Student', institutionId } });
    if (!student) throw new NotFoundException('Student not found');
    return this.prisma.transportPass.create({
      data: {
        routeId: dto.routeId, studentId: dto.studentId, institutionId,
        startDate: new Date(dto.startDate), endDate: new Date(dto.endDate),
        fee: dto.fee, status: 'Active',
      },
    });
  }

  async findAllPasses(institutionId: string, query?: { status?: string; routeId?: string }) {
    const where: any = { institutionId };
    if (query?.status) where.status = query.status;
    if (query?.routeId) where.routeId = query.routeId;
    return this.prisma.transportPass.findMany({
      where, include: { route: true, student: { select: { id: true, name: true, rollNo: true } } },
      orderBy: { startDate: 'desc' },
    });
  }

  async cancelPass(institutionId: string, id: string) {
    const pass = await this.prisma.transportPass.findFirst({ where: { id, institutionId } });
    if (!pass) throw new NotFoundException('Pass not found');
    return this.prisma.transportPass.update({ where: { id }, data: { status: 'Cancelled' } });
  }
}
