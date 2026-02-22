import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  pgEnum,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Define the match status enum
export const matchStatusEnum = pgEnum("match_status", [
  "scheduled",
  "live",
  "finished",
]);

export const matches = pgTable(
  "matches",
  {
    id: serial("id").primaryKey(),
    sport: text("sport").notNull(),
    homeTeam: text("home_team").notNull(),
    awayTeam: text("away_team").notNull(),
    status: matchStatusEnum("status").default("scheduled").notNull(),
    startTime: timestamp("start_time", { mode: "date" }),
    endTime: timestamp("end_time", { mode: "date" }),
    homeScore: integer("home_score").default(0).notNull(),
    awayScore: integer("away_score").default(0).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    // Index for quickly fetching all 'live' matches
    index("matches_status_idx").on(table.status),
  ],
);

export const commentary = pgTable(
  "commentary",
  {
    id: serial("id").primaryKey(),
    matchId: integer("match_id")
      .references(() => matches.id, { onDelete: "cascade" })
      .notNull(),
    minute: integer("minute"),
    sequence: integer("sequence").notNull(), // Crucial for ordering events within the same minute
    period: text("period"), // e.g., "1st Half", "Q4", "Overtime"
    eventType: text("event_type").notNull(), // e.g., "goal", "foul", "substitution"
    actor: text("actor"), // Player name or entity involved
    team: text("team"), // The team associated with the event
    message: text("message").notNull(),
    metadata: jsonb("metadata"), // Flexible storage for specific event details (coordinates, assist info, etc.)
    tags: text("tags").array(), // PostgreSQL array for filtering (e.g., ['highlight', 'goal'])
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    // Index for quickly fetching commentary for a specific match
    index("commentary_match_id_idx").on(table.matchId),
  ],
);

// Drizzle Relations for easy query building
export const matchesRelations = relations(matches, ({ many }) => ({
  commentary: many(commentary),
}));

export const commentaryRelations = relations(commentary, ({ one }) => ({
  match: one(matches, {
    fields: [commentary.matchId],
    references: [matches.id],
  }),
}));

export type Match = typeof matches.$inferSelect;
export type Commentary = typeof commentary.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;
export type NewCommentary = typeof commentary.$inferInsert;
