import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class PlacementService {
  constructor(private readonly prisma: PrismaService) {}

  async createDrive(institutionId: string, dto: {
    companyName: string; jobRole?: string; jobDescription?: string;
    package?: number; location?: string; eligibilityCriteria?: string;
    applicationDeadline?: string;
  }) {
    return this.prisma.placement.create({
      data: {
        companyName: dto.companyName,
        jobTitle: dto.jobRole,
        description: dto.jobDescription,
        package: dto.package,
        location: dto.location,
        eligibility: dto.eligibilityCriteria,
        lastDate: dto.applicationDeadline ? new Date(dto.applicationDeadline) : null,
        status: 'Open',
        institutionId,
      },
    });
  }

  async findAllDrives(institutionId: string, query?: { status?: string; page?: number; limit?: number }) {
    const where: any = { institutionId };
    if (query?.status) where.status = query.status;
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.placement.findMany({ where, skip, take: limit, orderBy: { id: 'desc' } }),
      this.prisma.placement.count({ where }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findDriveById(institutionId: string, id: string) {
    const drive = await this.prisma.placement.findFirst({ where: { id, institutionId } });
    if (!drive) throw new NotFoundException('Placement drive not found');
    return drive;
  }

  async updateDrive(institutionId: string, id: string, dto: any) {
    await this.findDriveById(institutionId, id);
    const data: any = {};
    if (dto.companyName !== undefined) data.companyName = dto.companyName;
    if (dto.jobRole !== undefined) data.jobTitle = dto.jobRole;
    if (dto.jobDescription !== undefined) data.description = dto.jobDescription;
    if (dto.package !== undefined) data.package = dto.package;
    if (dto.location !== undefined) data.location = dto.location;
    if (dto.eligibilityCriteria !== undefined) data.eligibility = dto.eligibilityCriteria;
    if (dto.applicationDeadline !== undefined) data.lastDate = new Date(dto.applicationDeadline);
    if (dto.status !== undefined) data.status = dto.status;
    return this.prisma.placement.update({ where: { id }, data });
  }

  async deleteDrive(institutionId: string, id: string) {
    await this.findDriveById(institutionId, id);
    await this.prisma.placement.delete({ where: { id } });
    return { message: 'Placement drive deleted successfully' };
  }

  async applyForDrive(institutionId: string, dto: {
    driveId: string; studentId: string; resumeUrl?: string; coverLetter?: string;
  }) {
    await this.findDriveById(institutionId, dto.driveId);
    return this.prisma.placement.update({
      where: { id: dto.driveId },
      data: { status: 'Applied' },
    });
  }

  async findAllApplications(institutionId: string, query?: { driveId?: string; status?: string }) {
    const where: any = { institutionId };
    if (query?.driveId) where.id = query.driveId;
    if (query?.status) where.status = query.status;
    return this.prisma.placement.findMany({ where, orderBy: { id: 'desc' } });
  }

  async findApplicationById(institutionId: string, id: string) {
    return this.findDriveById(institutionId, id);
  }

  async updateApplicationStatus(institutionId: string, id: string, dto: { status: string }) {
    await this.findDriveById(institutionId, id);
    return this.prisma.placement.update({
      where: { id },
      data: { status: dto.status },
    });
  }
}

