import express from "express";
import favouriteController from "./controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const route = express.Router();

// ----------------
// GET routes
// ----------------
route.get(
  "/matches/list",
  verifyToken,
  favouriteController.favouriteMatcheslist
);
route.post(
  "/matches/add",
  verifyToken,
  favouriteController.favouriteMatchesadd
);
route.get("/player/list", verifyToken, favouriteController.favouritePlayerlist);
route.post("/player/add", verifyToken, favouriteController.favouritePlayersadd);
route.post("/team/add", verifyToken, favouriteController.favouriteTeamsadd);
route.get("/team/list", verifyToken, favouriteController.favouriteTeamList);
route.post("/league/add", verifyToken, favouriteController.favouriteLeagueadd);
route.get("/league/list", verifyToken, favouriteController.favouriteLeagueList);

export default route;
