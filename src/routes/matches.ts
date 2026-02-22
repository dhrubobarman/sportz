import { Hono } from "hono";
import {
  createMatchSchema,
  listMatchesQuerySchema,
} from "../validation/matches";
import { db } from "../db/db";
import { matches } from "../db/schema";
import { getMatchStatus } from "../utils/match-status";
import { desc } from "drizzle-orm";

const matchRouter = new Hono();
const MAX_LIMIT = 100;

matchRouter.get("/", async (c) => {
  const parsed = listMatchesQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: "Invalid query", details: parsed.error }, 400);
  }
  const limit = Math.min(parsed.data.limit ?? 50, MAX_LIMIT);

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

matchRouter.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = createMatchSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid payload", details: parsed.error }, 400);
  }
  const {
    data: { startTime, endTime, homeScore, awayScore, ...rest },
  } = parsed;

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

    return c.json({ message: "Match created", data: event }, 200);
  } catch (error) {
    return c.json({ error: "Failed to create match", details: error }, 500);
  }
});

export default matchRouter;
