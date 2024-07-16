import express from "express";
import favouriteController from "./controller.js";

const route = express.Router();

// ----------------
// GET routes
// ----------------
route.post("/matches/add", favouriteController.favouriteMatchesadd);
route.post("/player/add", favouriteController.favouritePlayersadd);
route.post("/team/add", favouriteController.favouriteTeamsadd);

export default route;
