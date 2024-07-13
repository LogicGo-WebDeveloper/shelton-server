import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import validate from "../validation/validation.js";
import CustomTeam from "../models/team.models.js";
import multer from "multer";
import * as path from "path";
import fs from "fs";

const createTeam = async (req, res, next) => {
  let fileSuffix = Date.now().toString();

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join("cricket-custom-module/public/team");
      fs.mkdir(uploadDir, { recursive: true }, (err) => {
        if (err) {
          console.error("Error creating upload directory:", err);
          cb(err, null);
        } else {
          cb(null, uploadDir);
        }
      });
    },
    filename: function (req, file, cb) {
      cb(null, `${fileSuffix}-${file.originalname}`);
    },
  });

  const upload = multer({ storage: storage }).single("teamImage");

  upload(req, res, async function (err) {
    const { teamName, city, addMySelfInTeam } = req.body;
    const teamImage = req.file ? `${fileSuffix}-${req.file.originalname}` : "";

    const result = validate.createTeam.validate({
      teamName,
      city,
      addMySelfInTeam,
      teamImage,
    });

    if (result.error) {
      return res.status(400).json({
        msg: result.error.details[0].message,
      });
    } else {
      if (err) {
        console.log(err);
      }

      await CustomTeam.create({
        teamName,
        city,
        addMySelfInTeam,
        teamImage,
      })
        .then((resp) => {
          return apiResponse({
            res,
            status: true,
            data: resp,
            message: "Team created successfully!",
            statusCode: StatusCodes.OK,
          });
        })
        .catch((err) => {
          console.log(err);
          return apiResponse({
            res,
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            status: false,
            message: "Internal server error",
          });
        });
    }
  });
};

const listTeams = async (req, res) => {
  try {
    const teams = await CustomTeam.find();
    return apiResponse({
      res,
      status: true,
      data: teams,
      message: "Teams fetched successfully!",
      statusCode: StatusCodes.OK,
    });
  } catch (err) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const updateTeam = async (req, res, next) => {
  const id = req.params.id;
  let fileSuffix = Date.now().toString();

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join("../public/team");
      fs.mkdir(uploadDir, { recursive: true }, (err) => {
        if (err) {
          console.error("Error creating upload directory:", err);
          cb(err, null);
        } else {
          cb(null, uploadDir);
        }
      });
    },
    filename: function (req, file, cb) {
      cb(null, `${fileSuffix}-${file.originalname}`);
    },
  });

  const upload = multer({ storage: storage }).single("teamImage");

  upload(req, res, async function (err) {
    const { teamName, city, addMySelfInTeam } = req.body;
    const teamImage = req.file ? `${fileSuffix}-${req.file.originalname}` : "";

    const result = validate.createTeam.validate({
      teamName,
      city,
      addMySelfInTeam,
      teamImage,
    });

    if (result.error) {
      return res.status(400).json({
        msg: result.error.details[0].message,
      });
    } else {
      if (err) {
        console.log(err);
      }

      await CustomTeam.findByIdAndUpdate(
        id,
        {
          teamName,
          city,
          addMySelfInTeam,
          teamImage,
        },
        { new: true }
      )
        .then((resp) => {
          return apiResponse({
            res,
            status: true,
            data: resp,
            message: "Team updated successfully!",
            statusCode: StatusCodes.OK,
          });
        })
        .catch((err) => {
          console.log(err);
          return apiResponse({
            res,
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            status: false,
            message: "Internal server error",
          });
        });
    }
  });
};

const deleteTeam = async (req, res) => {
  const id = req.params.id;
  try {
    await CustomTeam.findByIdAndDelete(id);
    return apiResponse({
      res,
      status: true,
      message: "Team deleted successfully!",
      statusCode: StatusCodes.OK,
    });
  } catch (err) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

export default {
  createTeam,
  listTeams,
  updateTeam,
  deleteTeam,
};
