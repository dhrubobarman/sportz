import "hono";
import { WebsocketServer } from "./ws/server";

declare module "hono" {
  interface ContextVariableMap extends WebsocketServer {
    // Add your custom variables here
  }
}
