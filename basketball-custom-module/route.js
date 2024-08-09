import express from "express";
import basketballTournamentController from "./controllers/basketball-tournament.controller.js";
import basketballTeamController from "./controllers/basketball-team.controller.js";
import basketballPlayerController from "./controllers/basketball-player.controllers.js";
import { verifyToken } from "../middleware/verifyToken.js";
import multer from "multer";
import validate from "../middleware/validate.js";
import validation from "./validation/validation.js";
import basketballCommonControllers from "./controllers/basketball-common.controllers.js";
import basketballMatchControllers from "./controllers/basketball-match.controllers.js";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const route = express.Router();

// ============================== For Tournament List ===========================================
route.post(
  "/tournament/add",
  verifyToken,
  upload.fields([
    { name: "tournamentImages", maxCount: 1 },
    { name: "tournamentBackgroundImage", maxCount: 1 },
  ]),
  basketballTournamentController.createBasketballTournament
);

route.get("/tournament/list", basketballTournamentController.basketballTournamentList);

route.post(
  "/tournament/update/:id",
  verifyToken,
  upload.fields([
    { name: "tournamentImages", maxCount: 1 },
    { name: "tournamentBackgroundImage", maxCount: 1 },
  ]),
  basketballTournamentController.updateBasketballTournament
);

// ============================== For Team List ===========================================
route.post(
  "/team/add",
  upload.single("teamImage"),
  verifyToken,
  validate(validation.createBasketballTeam),
  basketballTeamController.createBasketballTeam
);

route.get("/team/list", verifyToken, basketballTeamController.basketballTeamList);

route.post(
  "/team/update/:id",
  upload.single("teamImage"),
  verifyToken,
  validate(validation.updateBasketballTeam),
  basketballTeamController.updateBasketballTeam
);

route.delete("/team/delete/:id", verifyToken, basketballTeamController.deleteBasketballTeam);

// ============================== For Player List ===========================================
route.post(
  "/player/add",
  verifyToken,
  upload.single("image"),
  validate(validation.createBasketballPlayer),
  basketballPlayerController.createBasketballPlayer
);

route.get("/player/list", verifyToken, basketballPlayerController.BasketballPlayersList);

route.post(
  "/player/update/:id",
  verifyToken,
  upload.single("image"),
  validate(validation.updateBasketballPlayer),
  basketballPlayerController.updateBasketballPlayer
);

route.post('/player/substitute', verifyToken, validate(validation.substitutePlayerValidation), basketballPlayerController.substituteBasketballPlayer);


route.delete("/player/delete/:id", verifyToken, basketballPlayerController.deleteBasketballPlayer);

// ============================== For Match List ===========================================
route.post(
  "/match/add",
  verifyToken,
  validate(validation.createBasketballMatch),
  basketballMatchControllers.createBasketballMatch
);

route.get("/match/list", basketballMatchControllers.listBasketballMatches);

route.post(
  "/match/update/:id",
  verifyToken,
  validate(validation.updateBasketballMatch),
  basketballMatchControllers.updateBasketballMatch
);

route.delete("/match/delete/:id", verifyToken, basketballMatchControllers.deleteBasketballMatch);

route.get("/match/statistics/:matchId", basketballMatchControllers.getBasketballMatchStatistics);

route.post(
  "/match/result/update",
  verifyToken,
  validate(validation.validateBasketballMatchResultUpdate),
  basketballMatchControllers.updateBasketballMatchResult
);


// route.get("/match/detail/:id", basketballMatchControllers.basketballDetailMatch);

// ============================== For common api routes =========================================
route.get("/player/roles", basketballCommonControllers.getBasketballPlayerRoles);



export default route;
