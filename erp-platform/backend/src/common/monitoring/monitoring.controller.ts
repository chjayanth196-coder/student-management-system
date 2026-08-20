import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../decorators/public.decorator';

@SkipThrottle()
@Controller()
export class MonitoringController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('health')
  @HttpCode(HttpStatus.OK)
  async checkHealth() {
    let dbStatus = 'ok';
    let dbLatency = 0;

    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - start;
    } catch {
      dbStatus = 'error';
    }

    return {
      status: dbStatus === 'ok' ? 'ok' : 'degraded',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
      database: {
        status: dbStatus,
        latency: `${dbLatency}ms`,
      },
    };
  }

  @Public()
  @Get('health/readiness')
  @HttpCode(HttpStatus.OK)
  async checkReadiness() {
    let dbReady = false;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbReady = true;
    } catch {
      // Database not ready
    }

    if (!dbReady) {
      return { status: 'not_ready', timestamp: new Date().toISOString() };
    }

    return { status: 'ready', timestamp: new Date().toISOString() };
  }

  @Public()
  @Get('health/liveness')
  @HttpCode(HttpStatus.OK)
  checkLiveness() {
    return { status: 'alive', timestamp: new Date().toISOString() };
  }

  @Public()
  @Get('metrics')
  async getMetrics() {
    let userCount = 0;
    let institutionCount = 0;

    try {
      userCount = await this.prisma.user.count();
      institutionCount = await this.prisma.institution.count();
    } catch {
      // Metrics unavailable
    }

    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      users: { total: userCount },
      institutions: { total: institutionCount },
      nodeVersion: process.version,
      platform: process.platform,
      cpuUsage: process.cpuUsage(),
    };
  }
}
