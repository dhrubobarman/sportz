import server from ".";
import { attachWebsockerServer } from "./ws/server";

export type Server = typeof server;

export type Env = {
  // Variables: ReturnType<typeof attachWebsockerServer>;
  Variables: {
    brodcastMatchCreated: (data: any) => void;
  };
};
