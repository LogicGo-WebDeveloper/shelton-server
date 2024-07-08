import express from "express";
import matchesController from "./controller.js";

const route = express.Router();

// ----------------
// GET routes
// ----------------
route.get("/standings", matchesController.getStandingsDetailsById);
route.get("/:id", matchesController.getSingleMatchDetail);
route.get("/:id/votes", matchesController.getMatchVotes);
route.get("/overs/:matchId", matchesController.getOverDetailsById);
route.get("/scorecard/:matchId", matchesController.getScoreCardDetailsById);
route.get("/squad/:matchId", matchesController.getSquadDetailsById);

// ----------------
// GET routes
// ----------------
route.get("/:id", matchesController.getSingleMatchDetail);
route.get("/:id/votes", matchesController.getMatchVotes);
route.get("/:id/pregame-form", matchesController.getPregameForm);
route.get("/:id/odds", matchesController.getMatchOdds);

export default route;
