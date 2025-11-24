import { Controller, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SimulatorService } from '../services/simulator.service';

@ApiTags('simulator')
@Controller('sim/smart-home')
export class SimulatorController {
  constructor(private simulator: SimulatorService) {}

  @Post('fall/:homeId')
  @ApiOperation({ summary: 'Simulate fall detection' })
  async simulateFall(@Param('homeId') homeId: string) {
    return this.simulator.simulateFall(homeId);
  }

  @Post('smoke/:homeId')
  @ApiOperation({ summary: 'Simulate smoke detection' })
  async simulateSmoke(@Param('homeId') homeId: string) {
    return this.simulator.simulateSmoke(homeId);
  }

  @Post('gas-leak/:homeId')
  @ApiOperation({ summary: 'Simulate gas leak' })
  async simulateGasLeak(@Param('homeId') homeId: string) {
    return this.simulator.simulateGasLeak(homeId);
  }

  @Post('water-leak/:homeId')
  @ApiOperation({ summary: 'Simulate water leak' })
  async simulateWaterLeak(@Param('homeId') homeId: string) {
    return this.simulator.simulateWaterLeak(homeId);
  }

  @Post('night-door/:homeId')
  @ApiOperation({ summary: 'Simulate nighttime door opening' })
  async simulateNightDoor(@Param('homeId') homeId: string) {
    return this.simulator.simulateNightDoorOpen(homeId);
  }

  @Post('motion-pattern/:homeId')
  @ApiOperation({ summary: 'Simulate normal motion pattern' })
  async simulateMotionPattern(
    @Param('homeId') homeId: string,
    @Query('duration') duration?: string,
  ) {
    return this.simulator.simulateMotionPattern(
      homeId,
      duration ? parseInt(duration) : 60,
    );
  }

  @Post('extreme-temp/:homeId')
  @ApiOperation({ summary: 'Simulate extreme temperature' })
  async simulateExtremeTemp(
    @Param('homeId') homeId: string,
    @Body() body: { temperature?: number },
  ) {
    return this.simulator.simulateExtremeTemp(homeId, body.temperature);
  }

  @Post('inactivity/:homeId')
  @ApiOperation({ summary: 'Simulate inactivity' })
  async simulateInactivity(
    @Param('homeId') homeId: string,
    @Query('hours') hours?: string,
  ) {
    return this.simulator.simulateInactivity(
      homeId,
      hours ? parseInt(hours) : 2,
    );
  }

  @Post('panic/:homeId')
  @ApiOperation({ summary: 'Simulate panic button press' })
  async simulatePanic(@Param('homeId') homeId: string) {
    return this.simulator.simulatePanicButton(homeId);
  }

  @Post('reset/:homeId')
  @ApiOperation({ summary: 'Reset simulation (remove simulated devices)' })
  async resetSimulation(@Param('homeId') homeId: string) {
    return this.simulator.resetSimulation(homeId);
  }
}
