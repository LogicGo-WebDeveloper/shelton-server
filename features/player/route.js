import express from "express";
import playerController from "./controller.js";

const route = express.Router();

// ----------------
// GET routes
// ----------------
route.get("/:id", playerController.getPlayerDetailsById);
route.get("/:id/events/:span/:page", playerController.getPlayerMatchesById);
route.get("/:id/national-team-statistics", playerController.getNationalTeamStatistics);

export default route;
