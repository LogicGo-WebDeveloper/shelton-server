import express from "express";
import sportController from "./controller.js";

const route = express.Router();

// ----------------
// GET routes
// ----------------
route.get("/:id", sportController.getTeamDetails);
route.get("/:id/players", sportController.getTeamPLayers);
route.get("/:id/performance", sportController.getTeamPerformance);
route.get("/:id/events/:span/:page", sportController.getTeamMatchesByTeam);
route.get("/:id/player-statistics/seasons", sportController.getTeamPlayerStatisticsSeasons);
route.get("/:id/media", sportController.getTeamMedia);
route.get("/:id/near-events", sportController.getTeamFeaturedEventsByTeams);
route.get(
  "/:id/unique-tournament/:uniqueTournamentId/season/:seasonId/top-players/:type",
  sportController.getTopPlayers
);

export default route;
