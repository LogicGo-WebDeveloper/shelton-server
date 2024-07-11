import express from "express";
import sportController from "./controllers/sport.controllers.js";
import tournamentController from "./controllers/tournament.controller.js";

const route = express.Router();

// ============================== For Sport List =================================================
route.get("/sports", sportController.getSportList);

// ============================== For Tournament List =================================================

route.post("/tournament-add", tournamentController.createTournament);
route.get("/tournament/list", tournamentController.listTournament);
route.put("/tournament/update/:id", tournamentController.tournamentupdate);

export default route;
