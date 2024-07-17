import express from "express";
import favouriteController from "./controller.js";

const route = express.Router();

// ----------------
// GET routes
// ----------------
route.get("/matches/list", favouriteController.favouriteMatcheslist);
route.post("/matches/add", favouriteController.favouriteMatchesadd);
route.get("/player/list", favouriteController.favouritePlayerlist);
route.post("/player/add", favouriteController.favouritePlayersadd);
route.post("/team/add", favouriteController.favouriteTeamsadd);
route.get("/team/list", favouriteController.favouriteTeamList);
route.post("/league/add", favouriteController.favouriteLeagueadd);
route.get("/league/list", favouriteController.favouriteLeagueList);

export default route;
