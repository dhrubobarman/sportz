import { z } from "zod";
import type { MiddlewareHandler } from "hono";

type ValidationTarget = "json" | "query" | "param";

// This is a generic that will create a type for the validated data.
// e.g. { Variables: { validatedQuery: { data: { limit: number, offset: number } } } }
type Validated<Target extends ValidationTarget, Schema extends z.ZodSchema> = {
  [K in `validated${Capitalize<Target>}`]: z.infer<Schema>;
};

export const validator = <
  Schema extends z.ZodSchema,
  Target extends ValidationTarget,
>(
  target: Target,
  schema: Schema,
  errorMessage?: string,
): MiddlewareHandler<{
  Variables: Validated<Target, Schema>;
}> => {
  return async (c, next) => {
    let value: unknown;
    try {
      switch (target) {
        case "json":
          value = await c.req.json();
          break;
        case "param":
          value = c.req.param();
          break;
        case "query":
          value = c.req.query();
          break;
      }
    } catch (e) {
      return c.json({ error: "Invalid request" }, 400);
    }

    const parsed = schema.safeParse(value);

    if (!parsed.success) {
      return c.json(
        {
          error: errorMessage || `Invalid ${target} payload`,
          details: parsed.error.issues,
        },
        400,
      );
    }

    c.set(
      `validated${target.charAt(0).toUpperCase() + target.slice(1)}` as any,
      parsed.data,
    );

    await next();
  };
};
