import { Test, TestingModule } from '@nestjs/testing';
import { StudentsService } from '../src/modules/students/students.service';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('StudentsService', () => {
  let service: StudentsService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return student when found', async () => {
      const mockStudent = {
        id: '1',
        name: 'Test Student',
        email: 'test@test.com',
        role: 'Student',
        institutionId: 'inst-1',
        isActive: true,
      };
      mockPrisma.user.findFirst.mockResolvedValue(mockStudent);

      const result = await service.findById('inst-1', '1');
      expect(result).toEqual(mockStudent);
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      await expect(
        service.findById('inst-1', 'nonexistent'),
      ).rejects.toThrow('Student not found');
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      mockPrisma.user.findMany.mockResolvedValue([{ id: '1', name: 'Test', role: 'Student' }]);
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await service.findAll('inst-1', { page: 1, limit: 20 });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });
  });
});
