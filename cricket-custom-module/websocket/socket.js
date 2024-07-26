import { WebSocketServer } from "ws";

const customWebsocket = (server) => {
  const wss = new WebSocketServer({ server });
  wss.on("connection", (ws) => {
    ws.on("message", async (message) => {
      let data;
      try {
        data = JSON.parse(message);
      } catch (error) {
        console.error("Invalid JSON:", error);
        ws.send(
          JSON.stringify({
            message: "Invalid JSON format",
            body: null,
            status: false,
          })
        );
        return;
      }
    });
  });
};

export default customWebsocket;
