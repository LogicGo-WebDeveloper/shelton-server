import express from "express";
import matchesController from "./controller.js";

const route = express.Router();

route.get("/overs/:matchId", matchesController.getOverDetailsById);
route.get("/scorecard/:matchId", matchesController.getScoreCardDetailsById);
route.get("/squad/:matchId", matchesController.getSquadDetailsById);

// ----------------
// GET routes
// ----------------

export default route;
