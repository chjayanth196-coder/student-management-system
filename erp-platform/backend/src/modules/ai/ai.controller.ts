import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(
    @CurrentUser('id') userId: string,
    @Body() body: { message: string },
  ) {
    return this.aiService.handleMessage(userId, body?.message || '');
  }

  @Get('suggestions')
  async suggestions(@CurrentUser('id') userId: string) {
    return this.aiService.getSuggestions(userId);
  }
}
