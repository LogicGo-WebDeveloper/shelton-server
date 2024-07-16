import express from "express";
import sportController from "./controller.js";

const route = express.Router();

// ----------------
// GET routes
// ----------------
route.get("/:sport/categories", sportController.getCountryLeagueList);
route.get("/:timezoneOffset/event-count", sportController.getSportList);
route.get("/:sport/news", sportController.getSportNews);
route.get("/:sport/schedule-matches/:date", sportController.getAllScheduleMatches);
route.get("/:sport/recent-matches", sportController.getRecentMatches);

export default route;
