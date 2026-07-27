import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';

/**
 * Build a Nest application configured the way `main.ts` configures the real
 * one, so integration tests exercise the same request pipeline as production.
 *
 * Two deliberate differences:
 *
 * 1. The global ValidationPipe is applied here explicitly. Without it, DTO
 *    validation silently does not run under test and a spec asserting a 400 on
 *    bad input would pass against an app that accepts anything.
 *
 * 2. Rate limiting is disabled via DISABLE_THROTTLE. Limits are per-IP and a
 *    suite makes far more requests than a human would, so leaving it enabled
 *    turns later tests into 429s that look like unrelated failures. Throttling
 *    is worth its own dedicated test rather than corrupting every other one.
 *
 * The global `api` prefix is opt-in, because the existing specs disagree about
 * whether they address routes with or without it.
 */
export async function createTestApp(
  options: { globalPrefix?: string } = {},
): Promise<INestApplication> {
  process.env.DISABLE_THROTTLE = 'true';

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (options.globalPrefix) {
    app.setGlobalPrefix(options.globalPrefix);
  }

  await app.init();
  return app;
}
