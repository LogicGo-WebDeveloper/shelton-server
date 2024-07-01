import express from "express";
import sportController from "./controller.js";

const route = express.Router();

// ----------------
// GET routes
// ----------------
route.get("/:id", sportController.getTournamentById);
route.get("/:id/seasons", sportController.getSeasonsByTournament);
route.get(
  "/:id/featured-events",
  sportController.getFeaturedEventsByTournament
);
route.get("/:id/media", sportController.getMediaByTournament);
route.get(
  "/:id/season/:seasonId/info",
  sportController.getSeasonInfoByTournament
);
route.get(
  "/:id/season/:seasonId/standings/:type",
  sportController.getSeasonStandingByTournament
);

route.get(
  "/:id/season/:seasonId/top-players/:positionDetailed",
  sportController.getSeasonTopPlayersByTournament
);

route.get(
  "/:id/season/:seasonId/events/:span/:page",
  sportController.getSeasonMatchesByTournament
);

export default route;
