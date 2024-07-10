import express from "express";
import sportController from "./controllers/sport.controllers.js";

const route = express.Router();

// ============================== For Sport List =================================================
route.get("/sports", sportController.getSportList);



// ============================== For Tournament List =================================================



export default route;
