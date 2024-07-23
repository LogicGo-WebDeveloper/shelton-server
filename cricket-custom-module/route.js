import express from "express";
import sportController from "./controllers/sport.controllers.js";
import tournamentController from "./controllers/tournament.controller.js";
import commonController from "./controllers/common.controllers.js";
import teamController from "./controllers/team.controllers.js";
import matchController from "./controllers/match.controllers.js";
import playerController from "./controllers/player.controllers.js";
import { verifyToken } from "../middleware/verifyToken.js";
import validate from "../middleware/validate.js";
import validation from "./validation/validation.js";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const route = express.Router();

// ============================== For Sport List ================================================
route.get("/sports", sportController.getSportList);

// ============================== For common api routes =========================================
route.get("/tournament/cities", commonController.getCityList);
route.get("/tournament/category", commonController.getTournamentCategory);
route.get(
  "/tournament/winning-prize",
  commonController.getTournamentWinningPrize
);

route.get("/tournament/match-types", commonController.getMatchTypes);
route.get("/tournament/match-on", commonController.getMatchOn);
route.get("/match/ball-types", commonController.getBallTypes);
route.get("/match/pitch-types", commonController.getPitchTypes);
route.get("/match/status", commonController.getMatchStatus);
route.get("/match/officials", commonController.getMatchOfficials);
route.get("/player/roles", commonController.getPlayerRoles);

// ============================== For Tournament List ===========================================
route.post(
  "/tournament/add",
  verifyToken,
  tournamentController.createTournament
);
route.get("/tournament/list", tournamentController.listTournament);
route.post(
  "/tournament/update/:id",
  verifyToken,
  tournamentController.tournamentupdate
);

route.post(
  "tournament/add/umpire",
  verifyToken,
  tournamentController.tournamentaddumpire
);

// ============================== For Team List ===========================================
route.post(
  "/team/add",
  upload.single("teamImage"),
  validate(validation.createTeam),
  teamController.createTeam
);
route.get("/team/list", teamController.listTeams);
route.put(
  "/team/update/:id",
  upload.single("teamImage"),
  validate(validation.updateTeam),
  teamController.updateTeam
);
route.delete("/team/delete/:id", teamController.deleteTeam);

// ============================== For Match List ===========================================
route.post("/match/add", matchController.createMatch);
route.get("/match/list", matchController.listMatches);
route.put("/match/update/:id", matchController.updateMatch);
route.delete("/match/delete/:id", matchController.deleteMatch);

// ============================== For Player List ===========================================
route.post("/player/add", playerController.createPlayer);
route.get("/player/list", playerController.listPlayers);
route.put("/player/update/:id", playerController.updatePlayer);
route.delete("/player/delete/:id", playerController.deletePlayer);

export default route;
