import { Injectable, PipeTransform } from '@nestjs/common';

/**
 * Parse an optional numeric query parameter.
 *
 * The global ValidationPipe runs with `transform: true`, and its primitive
 * transform does `Number(value)` unconditionally for a `Number` metatype - so
 * an omitted `?days=` arrives as NaN rather than undefined. A TypeScript
 * default parameter (`days = 30`) only applies to undefined, so the default is
 * skipped and NaN flows into date arithmetic and Prisma `take:` clauses. That
 * produced 500s on ordinary requests such as `GET /notifications`.
 *
 * This pipe restores the intended contract: absent, blank, or unparseable
 * means undefined, so the downstream default applies.
 *
 * Note the limit of what this can enforce. Parameter-level pipes run AFTER the
 * global ValidationPipe, which has already turned both an omitted `?limit=`
 * and a garbage `?limit=abc` into NaN. By the time this pipe runs the two are
 * indistinguishable, so a malformed value falls back to the default rather
 * than returning 400. Rejecting malformed input needs a query DTO with
 * class-validator (see PLATFORM_AUDIT.md H8), not a pipe.
 */
@Injectable()
export class OptionalIntPipe implements PipeTransform<unknown, number | undefined> {
  transform(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? Math.floor(value) : undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.floor(parsed) : undefined;
  }
}
