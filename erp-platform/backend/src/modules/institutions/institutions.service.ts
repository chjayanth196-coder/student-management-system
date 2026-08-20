import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';

@Injectable()
export class InstitutionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInstitutionDto) {
    const slug = dto.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const existing = await this.prisma.institution.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException('An institution with this name already exists');
    }

const institution = await this.prisma.institution.create({
      data: {
        name: dto.name,
        slug,
        type: dto.type,
        logo: dto.logo,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        country: dto.country,
        phone: dto.phone,
        email: dto.email,
        website: dto.website,
        principal: dto.principal,
        academicYear: dto.academicYear,
        isActive: dto.isActive ?? true,
        colors: dto.colors,
        settings: dto.settings,
      },
    });

    // Auto-create a CollegeAdmin account for the new institution if admin credentials are provided
    let admin = null;
    if (dto.adminEmail && dto.adminPassword) {
      const hashedPassword = await bcrypt.hash(dto.adminPassword, 10);
admin = await this.prisma.user.create({
        data: {
          email: dto.adminEmail.toLowerCase(),
          password: hashedPassword,
          name: dto.adminName || `Admin - ${dto.name}`,
          role: 'CollegeAdmin',
          institutionId: institution.id,
          isActive: true,
          // Store plaintext so the Super Admin can view/reset it later.
          plainPassword: dto.adminPassword,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          institutionId: true,
        },
      });
    }

    return { institution, admin };
  }

  async findAll(
    query?: { q?: string; type?: string; status?: string; page?: number; limit?: number },
    user?: any,
  ) {
    const where: any = {};

    // Non-super admins only see their own institution
    if (user && user.role !== 'SuperAdmin' && user.institutionId) {
      where.id = user.institutionId;
    }

    if (query?.type) where.type = query.type;
    if (query?.status === 'active') where.isActive = true;
    if (query?.status === 'inactive') where.isActive = false;

    if (query?.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { email: { contains: query.q, mode: 'insensitive' } },
        { principal: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.institution.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.institution.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

async findById(id: string, user?: any) {
    const institution = await this.prisma.institution.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            departments: true,
            classes: true,
            staff: true,
          },
        },
      },
    });

    if (!institution) {
      throw new NotFoundException('Institution not found');
    }

    // Non-super admins can only view their own institution
    if (user && user.role !== 'SuperAdmin' && user.institutionId !== id) {
      throw new NotFoundException('Institution not found');
    }

    return institution;
  }

  async findBySlug(slug: string) {
    const institution = await this.prisma.institution.findUnique({ where: { slug } });
    if (!institution) {
      throw new NotFoundException('Institution not found');
    }
    return institution;
  }

  async update(id: string, dto: UpdateInstitutionDto, user?: any) {
    const institution = await this.prisma.institution.findUnique({ where: { id } });
    if (!institution) {
      throw new NotFoundException('Institution not found');
    }

    // Non-super admins can only edit their own institution
    if (user && user.role !== 'SuperAdmin' && user.institutionId !== id) {
      throw new NotFoundException('Institution not found');
    }

    // Prevent CollegeAdmin from changing the institution name/type/slug or deactivating.
    // They are only allowed to fill in profile details.
    const isSuperAdmin = !user || user.role === 'SuperAdmin';
    const data: any = { ...dto };
    if (!isSuperAdmin) {
      delete data.name;
      delete data.type;
      delete data.isActive;
    }

    return this.prisma.institution.update({
      where: { id },
      data,
    });
  }

  async toggleActive(id: string) {
    const institution = await this.prisma.institution.findUnique({ where: { id } });
    if (!institution) {
      throw new NotFoundException('Institution not found');
    }

    return this.prisma.institution.update({
      where: { id },
      data: { isActive: !institution.isActive },
    });
  }

  async remove(id: string) {
    const institution = await this.prisma.institution.findUnique({ where: { id } });
    if (!institution) {
      throw new NotFoundException('Institution not found');
    }

    // Soft-deactivate instead of hard delete
    await this.prisma.institution.update({
      where: { id },
      data: { isActive: false },
    });

    // Deactivate all users of this institution
    await this.prisma.user.updateMany({
      where: { institutionId: id },
      data: { isActive: false },
    });

    return { message: 'Institution deactivated successfully' };
  }
}
