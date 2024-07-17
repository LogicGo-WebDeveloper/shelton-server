import express from "express";
import sportController from "./controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const route = express.Router();

// ----------------
// GET routes
// ----------------
route.get("/:sport/categories", sportController.getCountryLeagueList);
route.get("/:timezoneOffset/event-count", sportController.getSportList);
route.get("/:sport/news", sportController.getSportNews);
route.get("/:sport/schedule-matches/:date", sportController.getAllScheduleMatches);
route.get("/:sport/recent-matches", verifyToken, sportController.getRecentMatches);

// // change password
// route.post(
//     "/change-password",
//     upload.none(),
//     verifyToken,
//     validate(authValidation.changePassword),
//     authController.changePassword
//   );

export default route;
