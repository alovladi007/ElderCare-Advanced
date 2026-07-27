import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { VoiceControlService } from '../services/voice-control.service';
import { OptionalIntPipe } from '../../common/pipes/optional-int.pipe';

@ApiTags('voice-control')
@Controller('smart-home/voice')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VoiceControlController {
  constructor(private voiceControl: VoiceControlService) {}

  @Post('command')
  @ApiOperation({ summary: 'Process voice command' })
  async processVoiceCommand(
    @Body()
    body: {
      elderId: string;
      homeId: string;
      transcript: string;
      confidence?: number;
    },
  ) {
    return this.voiceControl.processVoiceCommand(
      body.elderId,
      body.homeId,
      body.transcript,
      body.confidence,
    );
  }

  @Get('history/:elderId')
  @ApiOperation({ summary: 'Get voice command history' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getVoiceHistory(
    @Param('elderId') elderId: string,
    @Query('limit', OptionalIntPipe) limit?: number,
  ) {
    return this.voiceControl.getVoiceHistory(elderId, limit);
  }

  @Get('commands')
  @ApiOperation({ summary: 'Get supported voice commands' })
  async getSupportedCommands() {
    return this.voiceControl.getSupportedCommands();
  }
}
