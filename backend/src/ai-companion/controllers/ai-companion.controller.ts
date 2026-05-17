import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AICompanionService } from '../services/ai-companion.service';

@ApiTags('ai-companion')
@Controller('ai-companion')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AICompanionController {
  constructor(private aiCompanion: AICompanionService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Chat with AI companion' })
  async chat(
    @Body()
    body: {
      elderId: string;
      message: string;
    },
  ) {
    return this.aiCompanion.chat(body.elderId, body.message);
  }

  @Get('conversation/:elderId')
  @ApiOperation({ summary: 'Get conversation history' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getConversationHistory(
    @Param('elderId') elderId: string,
    @Query('limit') limit?: number,
  ) {
    return this.aiCompanion.getRecentMessages(elderId, limit || 50);
  }

  @Get('stats/:elderId')
  @ApiOperation({ summary: 'Get conversation statistics' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getStats(
    @Param('elderId') elderId: string,
    @Query('days') days?: number,
  ) {
    return this.aiCompanion.getConversationStats(elderId, days);
  }

  @Post('reminder')
  @ApiOperation({ summary: 'Send proactive reminder' })
  async sendReminder(
    @Body()
    body: {
      elderId: string;
      type: 'MEDICATION' | 'APPOINTMENT' | 'EXERCISE' | 'CHECK_IN';
      data?: any;
    },
  ) {
    return this.aiCompanion.sendProactiveReminder(body.elderId, body.type, body.data);
  }
}
