import express from "express";
import tournamentRoute from "./tournament.route.js";

const route = express.Router();

route.use("/tournaments", tournamentRoute);

export default route;
