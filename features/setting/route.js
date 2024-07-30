import express from "express";
import settingController from "./controller.js";
import validate from "../../middleware/validate.js";
import authValidation from "../auth/validation.js";

const route = express.Router();

// ----------------
// GET routes
// ----------------
route.get("/theme", settingController.getTheme);
route.get("/aboutUs", settingController.getAboutUs);

// ----------------
// POST routes
// ----------------
route.post("/logout", settingController.logout);

route.post("/profile/:id", settingController.updateProfile);

export default route;
