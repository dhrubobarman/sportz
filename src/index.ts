import { Hono } from "hono";
import matches from "./routes/matches";

const app = new Hono();

app.get("/", (c) => {
  return c.json({ h: "Welcome to Sportz!" });
});

app.route("/matches", matches);

export default {
  port: 8000,
  fetch: app.fetch,
};
