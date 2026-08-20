import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Controller()
export class HealthController {
  @Get('health')
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
    };
  }

  @Get()
  root() {
    return {
      name: 'Multi-College ERP Platform API',
      version: '1.0.0',
      docs: '/api/v1/docs',
    };
  }
}
