import express from "express";
import sportController from "./controllers/sport.controllers.js";
import tournamentController from "./controllers/tournament.controller.js";
import commonController from "./controllers/common.controllers.js";

const route = express.Router();

// ============================== For Sport List ================================================
route.get("/sports", sportController.getSportList);

// ============================== For common api routes =========================================
route.get("/tournament/cities", commonController.getCityList);
route.get("/tournament/category", commonController.getTournamentCategory);
route.get("/tournament/winning-prize", commonController.getTournamentWinningPrize);
route.get("/tournament/match-types", commonController.getMatchTypes);
route.get("/tournament/match-on", commonController.getMatchOn);

// ============================== For Tournament List ===========================================
route.post("/tournament-add", tournamentController.createTournament);

export default route;
