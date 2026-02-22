import { serve } from "@hono/node-server";
import { Hono } from "hono";
import matches from "./routes/matches";
import { attachWebsockerServer } from "./ws/server";

const app = new Hono();
const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || "0.0.0.0";

const server = serve(
  {
    port: PORT,
    fetch: app.fetch,
    hostname: HOST,
  },
  (info) => {
    const host = HOST === "0.0.0.0" ? "localhost" : HOST;
    const baseUrl = `http://${host}:${info.port}`;
    console.log(`Server is running on ${baseUrl}`);
    console.log(
      `Websocket server is running on ${baseUrl.replace("http", "ws")}/ws`,
    );
  },
);
const { brodcastMatchCreated } = attachWebsockerServer(server);

app.use("*", async (c, next) => {
  c.set("brodcastMatchCreated", brodcastMatchCreated);
  await next();
});

app.get("/", (c) => {
  return c.json({ h: "Welcome to Sportz!" });
});

app.route("/matches", matches);

export default server;
