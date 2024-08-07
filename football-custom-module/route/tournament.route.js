import express from "express";
import multer from "multer";
import { verifyToken } from "../../middleware/verifyToken.js";
import controller from "../controller/tournament.controller.js";
import validate from "../../middleware/validate.js";
import validation from "../validation/tournament.validation.js";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const route = express.Router();

/**
 * Create Tournaments
 */
route.post(
  "/",
  upload.fields([
    { name: "tournamentImage", maxCount: 1 },
    { name: "backgroundImage", maxCount: 1 },
  ]),
  verifyToken,
  validate(validation.createTournament),
  controller.createTournament
);

/**
 * Get Tournaments
 */
route.get("/:id?", controller.getTournaments);

/**
 * Update Tournaments
 */
route.post(
  "/:id",
  verifyToken,
  validate(validation.updateTournament),
  controller.updateTournament
);

export default route;
