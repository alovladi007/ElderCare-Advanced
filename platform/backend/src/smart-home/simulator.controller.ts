import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { SimulatorService } from './services/simulator.service';

@ApiTags('smart-home/simulator')
@Controller('smart-home/simulator')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SimulatorController {
  constructor(private readonly simulator: SimulatorService) {}

  @Post('homes/:homeId/fall')
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN)
  @ApiOperation({ summary: '🔴 Simulate fall event' })
  simulateFall(@Param('homeId') homeId: string) {
    return this.simulator.simulateFall(homeId);
  }

  @Post('homes/:homeId/smoke')
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN)
  @ApiOperation({ summary: '🔥 Simulate smoke detection' })
  simulateSmoke(@Param('homeId') homeId: string) {
    return this.simulator.simulateSmoke(homeId);
  }

  @Post('homes/:homeId/gas')
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN)
  @ApiOperation({ summary: '☠️ Simulate gas leak' })
  simulateGasLeak(@Param('homeId') homeId: string) {
    return this.simulator.simulateGasLeak(homeId);
  }

  @Post('homes/:homeId/motion')
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN)
  @ApiOperation({ summary: '📍 Simulate motion pattern (normal activity)' })
  simulateMotionPattern(
    @Param('homeId') homeId: string,
    @Body() body: { hours?: number },
  ) {
    return this.simulator.simulateMotionPattern(homeId, body.hours || 1);
  }

  @Post('homes/:homeId/door')
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN)
  @ApiOperation({ summary: '🚪 Simulate door opening' })
  simulateDoorOpen(
    @Param('homeId') homeId: string,
    @Body() body: { isNight?: boolean },
  ) {
    return this.simulator.simulateDoorOpen(homeId, body.isNight || false);
  }

  @Post('homes/:homeId/temperature')
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN)
  @ApiOperation({ summary: '🌡️ Simulate temperature reading' })
  simulateTemperature(
    @Param('homeId') homeId: string,
    @Body() body: { celsius: number },
  ) {
    return this.simulator.simulateTemperature(homeId, body.celsius);
  }

  @Post('homes/:homeId/panic')
  @Roles(UserRole.ADMIN, UserRole.CLINICIAN)
  @ApiOperation({ summary: '🆘 Simulate panic button press' })
  simulatePanicButton(@Param('homeId') homeId: string) {
    return this.simulator.simulatePanicButton(homeId);
  }
}
