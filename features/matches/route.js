import express from "express";
import matchesController from "./controller.js";

const route = express.Router();

// ----------------
// GET routes
// ----------------
route.get("/:id", matchesController.getSingleMatchDetail);
route.get("/:id/votes", matchesController.getMatchVotes);

export default route;
