import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Roles a user may assign to themselves during self-service registration.
 *
 * ADMIN, CLINICIAN and CAREGIVER are deliberately excluded: those carry access
 * to other people's health records and must be provisioned by an existing
 * administrator, never claimed by the person signing up.
 */
export const SELF_REGISTERABLE_ROLES = ['FAMILY', 'ELDER'] as const;
export type SelfRegisterableRole = (typeof SELF_REGISTERABLE_ROLES)[number];

export class RegisterDto {
  @ApiProperty({ example: 'person@example.com' })
  @IsEmail({}, { message: 'A valid email address is required' })
  @MaxLength(255)
  email: string;

  @ApiProperty({ minLength: 12, description: 'At least 12 characters, with upper, lower, and a digit' })
  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters long' })
  @MaxLength(128)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one lowercase letter, one uppercase letter, and one number',
  })
  password: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @ApiProperty({ enum: SELF_REGISTERABLE_ROLES, default: 'FAMILY' })
  @IsOptional()
  @IsIn(SELF_REGISTERABLE_ROLES as unknown as string[], {
    message: `Role must be one of: ${SELF_REGISTERABLE_ROLES.join(', ')}`,
  })
  role?: SelfRegisterableRole;
}
