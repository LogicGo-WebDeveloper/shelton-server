import express from "express";
import cors from "cors";
import route from "./router.js";
import config from "./config/config.js";
import connectDB from "./config/db.config.js";
import morgan from "morgan";
import errorHandler from "./middleware/errorHandler.js";
import http from "http";
import setupWebSocket from "./websocket/websocketServer.js";
import {
  InsertCityList,
  InsertMatchOn,
  InsertMatchType,
  InsertSportList,
  InsertTournamentCategory,
  InsertTournamentWinningPrize,
} from "./middleware/common.js";

const app = express();
const server = http.createServer(app);

// WebSocket server setup
setupWebSocket(server);

app.disable("x-powered-by");

// connect database
connectDB();

// middleware
app.use(morgan("dev"));
app.use(express.json());
app.use(
  cors({
    origin: config.frontendUrl.split(","),
  })
);
app.use("/images", express.static("cricket-custom-module/public"));
InsertSportList();
InsertCityList();
InsertTournamentCategory();
InsertMatchType();
InsertMatchOn();
InsertTournamentWinningPrize();

app.use("/api/auth", route.authRoute);
app.use("/api/v1/sport", route.sportRoute);
app.use("/api/v1/unique-tournament", route.uniqueTournamentRoute);
app.use("/api/v1/team", route.teamRoute);
app.use("/api/v1/setting", route.settingRoute);
app.use("/api/v1/category", route.categoryRoute);
app.use("/api/v1/tournament", route.tournamentRoute);
app.use("/api/v1/player", route.playerRoute);
app.use("/api/v1/event", route.matchesRoute);
app.use("/api/v1/custom", route.customCricketRoute);

app.use(errorHandler);

// start server
server.listen(config.port, () => {
  console.log(`Server is running on port http://localhost:${config.port}`);
});

// uncaught exceptions and unhandled rejections
process.on("uncaughtException", function (err) {
  console.error("Uncaught Exception:", err);
});
process.on("unhandledRejection", function (err) {
  console.error("Unhandled Rejection:", err);
});
