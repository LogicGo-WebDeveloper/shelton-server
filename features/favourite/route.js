import express from "express";
import favouriteController from "./controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const route = express.Router();

// ----------------
// GET routes
// ----------------
route.get("/matches/list",verifyToken,favouriteController.favouriteMatcheslist);
route.get("/player/list", verifyToken, favouriteController.favouritePlayerlist);
route.get("/team/list", verifyToken, favouriteController.favouriteTeamList);
route.get("/league/list", verifyToken, favouriteController.favouriteLeagueList);

// ----------------
// POST routes
// ----------------
route.post("/matches/add",verifyToken,favouriteController.favouriteMatchesadd);
route.post("/player/add", verifyToken, favouriteController.favouritePlayersadd);
route.post("/team/add", verifyToken, favouriteController.favouriteTeamsadd);
route.post("/league/add", verifyToken, favouriteController.favouriteLeagueadd);

export default route;
