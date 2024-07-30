import express from "express";
import sportController from "./controllers/sport.controllers.js";
import tournamentController from "./controllers/tournament.controller.js";
import commonController from "./controllers/common.controllers.js";
import teamController from "./controllers/team.controllers.js";
import matchController from "./controllers/match.controllers.js";
import playerController from "./controllers/player.controllers.js";
import playerOverController from "./controllers/player.overs.js";
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
route.get("/player/out-reasons", commonController.getPlayerOutReason);

// ============================== For Tournament List ===========================================
route.post(
  "/tournament/add",
  verifyToken,
  upload.fields([
    { name: "tournamentImages", maxCount: 1 },
    { name: "tournamentBackgroundImage", maxCount: 1 },
  ]),
  tournamentController.createTournament
);
route.get("/tournament/list", tournamentController.listTournament);
route.post(
  "/tournament/update/:id",
  verifyToken,
  upload.fields([
    { name: "tournamentImages", maxCount: 1 },
    { name: "tournamentBackgroundImage", maxCount: 1 },
  ]),
  tournamentController.tournamentUpdate
);

route.post("/tournament/add/umpire", tournamentController.tournamentAddUmpire);
route.get("/tournament/list/umpire", tournamentController.tournamentListUmpire);

// ============================== For Team List ===========================================
route.post(
  "/team/add",
  upload.single("teamImage"),
  verifyToken,
  validate(validation.createTeam),
  teamController.createTeam
);

route.get("/team/list", verifyToken, teamController.listTeams);

route.post(
  "/team/update/:id",
  upload.single("teamImage"),
  verifyToken,
  validate(validation.updateTeam),
  teamController.updateTeam
);

route.delete("/team/delete/:id", verifyToken, teamController.deleteTeam);

// ============================== For Match List ===========================================
route.post(
  "/match/add",
  verifyToken,
  validate(validation.createMatch),
  matchController.createMatch
);

route.get("/match/list", matchController.listMatches);

route.post(
  "/match/update/:id",
  verifyToken,
  validate(validation.updateMatch),
  matchController.updateMatch
);

route.post(
  "/match/update/:id/status",
  verifyToken,
  validate(validation.updateStatus),
  matchController.updateMatchStatus
);

route.post(
  "/match/toss",
  verifyToken,
  validate(validation.updateTossStatus),
  matchController.updateTossStatus
);

route.delete("/match/delete/:id", verifyToken, matchController.deleteMatch);

route.get("/match/scorecard/:matchId", matchController.getMatchScorecard);
route.get("/match/:id/squads", matchController.getMatchSquads);

route.post(
  "/match/scorecard/update-players-info/:matchId",
  // validate(validation.updatePlayerStatus),
  matchController.updateStartingPlayerScorecard
);

route.get("/match/summary/:matchId", matchController.getMatchSummary);

// ============================== For Player List ===========================================
route.post(
  "/player/add",
  verifyToken,
  upload.single("image"),
  validate(validation.createPlayer),
  playerController.createPlayer
);

route.get("/player/list", verifyToken, playerController.listPlayers);

route.post(
  "/player/update/:id",
  verifyToken,
  upload.single("image"),
  validate(validation.updatePlayer),
  playerController.updatePlayer
);

route.delete("/player/delete/:id", verifyToken, playerController.deletePlayer);

// ============================== For Player Overs ===========================================
route.get(
  "/player/overs/:id",
  verifyToken,
  playerOverController.getPlayerOvers
);

route.post(
  "/player/overs/update/:id",
  verifyToken,
  validate(validation.updateCustomPlayerOvers),
  playerOverController.updatePlayerOvers
);

export default route;
