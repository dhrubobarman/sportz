import { Hono } from "hono";
import {
  createMatchSchema,
  listMatchesQuerySchema,
} from "../validation/matches";
import { db } from "../db/db";
import { matches } from "../db/schema";
import { getMatchStatus } from "../utils/match-status";
import { desc } from "drizzle-orm";
import { validator } from "../middleware/validator";

const matchRouter = new Hono();
const MAX_LIMIT = 100;

matchRouter.get("/", validator("query", listMatchesQuerySchema), async (c) => {
  const parsed = c.var.validatedQuery;

  const limit = Math.min(parsed.limit ?? 50, MAX_LIMIT);

  try {
    const data = await db
      .select()
      .from(matches)
      .orderBy(desc(matches.createdAt))
      .limit(limit);
    return c.json({ data }, 200);
  } catch (error) {
    return c.json({ error: "Failed to fetch matches", details: error }, 500);
  }
});

matchRouter.post("/", validator("json", createMatchSchema), async (c) => {
  const parsed = c.var.validatedJson;

  const { startTime, endTime, homeScore, awayScore, ...rest } = parsed;

  try {
    const [event] = await db
      .insert(matches)
      .values({
        ...rest,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        homeScore: homeScore ?? 0,
        awayScore: awayScore ?? 0,
        status: getMatchStatus(startTime, endTime),
      })
      .returning();

    if (c.var.brodcastMatchCreated) {
      c.var.brodcastMatchCreated(event);
    }

    return c.json({ message: "Match created", data: event }, 200);
  } catch (error) {
    return c.json({ error: "Failed to create match", details: error }, 500);
  }
});

export default matchRouter;
