import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class HostelService {
  constructor(private readonly prisma: PrismaService) {}

  async createRoom(institutionId: string, dto: {
    hostelName: string; roomNo: string; roomType: string;
    capacity: number; rent: number; floor?: number; amenities?: string;
  }) {
    const existing = await this.prisma.hostelRoom.findUnique({
      where: { institutionId_hostelName_roomNo: { institutionId, hostelName: dto.hostelName, roomNo: dto.roomNo } },
    });
    if (existing) throw new ConflictException('Room already exists');
    return this.prisma.hostelRoom.create({ data: { ...dto, institutionId, occupied: 0 } });
  }

  async findAllRooms(institutionId: string, query?: { hostelName?: string; roomType?: string; page?: number; limit?: number }) {
    const where: any = { institutionId };
    if (query?.hostelName) where.hostelName = query.hostelName;
    if (query?.roomType) where.roomType = query.roomType;
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.hostelRoom.findMany({ where, skip, take: limit, orderBy: { hostelName: 'asc' } }),
      this.prisma.hostelRoom.count({ where }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findRoomById(institutionId: string, id: string) {
    const room = await this.prisma.hostelRoom.findFirst({ where: { id, institutionId } });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  async updateRoom(institutionId: string, id: string, dto: any) {
    await this.findRoomById(institutionId, id);
    return this.prisma.hostelRoom.update({ where: { id }, data: dto });
  }

  async deleteRoom(institutionId: string, id: string) {
    await this.findRoomById(institutionId, id);
    await this.prisma.hostelRoom.delete({ where: { id } });
    return { message: 'Room deleted successfully' };
  }

  async allocateRoom(institutionId: string, dto: { roomId: string; studentId: string; startDate: string; endDate?: string }) {
    const room = await this.findRoomById(institutionId, dto.roomId);
    if (room.occupied >= room.capacity) throw new ConflictException('Room is full');
    const allocation = await this.prisma.hostelAllocation.create({
      data: {
        roomId: dto.roomId, studentId: dto.studentId, institutionId,
        startDate: new Date(dto.startDate), endDate: dto.endDate ? new Date(dto.endDate) : null, status: 'Active',
      },
    });
    await this.prisma.hostelRoom.update({ where: { id: dto.roomId }, data: { occupied: { increment: 1 } } });
    return allocation;
  }

  async deallocateRoom(institutionId: string, allocationId: string) {
    const allocation = await this.prisma.hostelAllocation.findFirst({ where: { id: allocationId, institutionId } });
    if (!allocation) throw new NotFoundException('Allocation not found');
    await this.prisma.hostelAllocation.update({ where: { id: allocationId }, data: { status: 'Inactive', endDate: new Date() } });
    await this.prisma.hostelRoom.update({ where: { id: allocation.roomId }, data: { occupied: { decrement: 1 } } });
    return { message: 'Room deallocated successfully' };
  }

  async getAllocations(institutionId: string, query?: { status?: string; hostelName?: string }) {
    const where: any = { institutionId };
    if (query?.status) where.status = query.status;
    if (query?.hostelName) where.room = { hostelName: query.hostelName };
    return this.prisma.hostelAllocation.findMany({
      where, include: { room: true, student: { select: { id: true, name: true, rollNo: true } } },
      orderBy: { startDate: 'desc' },
    });
  }
}
