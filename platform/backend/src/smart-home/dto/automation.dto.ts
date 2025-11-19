import { IsString, IsOptional, IsBoolean, IsEnum, IsObject, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AutomationTriggerType, EventSeverity } from '@prisma/client';

export class CreateAutomationRuleDto {
  @ApiProperty({ example: 'Turn on lights when motion detected' })
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: AutomationTriggerType, example: AutomationTriggerType.SENSOR_EVENT })
  @IsEnum(AutomationTriggerType)
  triggerType: AutomationTriggerType;

  @ApiProperty({
    example: { sensorId: 'uuid', eventType: 'STATE_CHANGE', valueEquals: 'ON' }
  })
  @IsObject()
  triggerConfigJson: any;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  conditionConfigJson?: any;

  @ApiProperty({
    example: [
      { type: 'ACTUATOR_COMMAND', actuatorId: 'uuid', commandParams: { on: true } }
    ]
  })
  @IsObject()
  actionsConfigJson: any;

  @ApiProperty({ enum: EventSeverity, required: false })
  @IsEnum(EventSeverity)
  @IsOptional()
  severity?: EventSeverity;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;
}

export class UpdateAutomationRuleDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  triggerConfigJson?: any;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  conditionConfigJson?: any;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  actionsConfigJson?: any;
}

export class CreateEmergencyScenarioDto {
  @ApiProperty({ example: 'Fall + No Response' })
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: { type: 'FALL_UNRESPONSIVE', conditions: [], timeoutSeconds: 120 }
  })
  @IsObject()
  triggerSignatureJson: any;

  @ApiProperty({
    example: [
      { delaySec: 0, action: 'ANNOUNCE', params: { message: 'Are you okay?' } },
      { delaySec: 60, action: 'CALL_FAMILY_IF_NO_CANCEL' },
      { delaySec: 180, action: 'CALL_EMERGENCY_IF_NO_CANCEL' }
    ]
  })
  @IsObject()
  stepwiseActionsJson: any;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;
}

export class CancelEmergencyScenarioDto {
  @ApiProperty({ example: 'e7a8b9c0-1234-5678-90ab-cdef12345678' })
  @IsUUID()
  instanceId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateHelpTriggerDto {
  @ApiProperty({ example: 'e7a8b9c0-1234-5678-90ab-cdef12345678' })
  @IsUUID()
  elderId: string;

  @ApiProperty({ example: 'BUTTON_PRESS' })
  @IsString()
  triggerType: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  sourceDeviceId?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  rawPayloadJson?: any;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
