// import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import * as path from "path";
import validate from "../validation/validation.js";
import CustomTournament from "../models/tournament.models.js";
import multer from "multer";
import fs from "fs";
import { apiResponse } from "../../helper/apiResponse.js";

const createTournament = async (req, res, next) => {
  let fileSuffix = Date.now().toString();

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      // Specify the destination directory where files will be uploaded.
      const uploadDir = path.join("../public/tournament");
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

  const upload = multer({ storage: storage }).single("tournamentImage");

  upload(req, res, async function (err, file, cb) {
    var sportId = req.body.sportId;
    var name = req.body.name;
    var cityId = req.body.cityId;
    var groundName = req.body.groundName;
    var organiserName = req.body.organiserName;
    var tournamentStartDate = req.body.tournamentStartDate;
    var tournamentEndDate = req.body.tournamentEndDate;
    var tournamentCategoryId = req.body.tournamentCategoryId;
    var tournamentMatchTypeId = req.body.tournamentMatchTypeId;
    var officials = req.body.officials;
    var moreTeams = req.body.moreTeams;
    var winningPrizeId = req.body.winningPrizeId;
    var matchOnId = req.body.matchOnId;
    var description = req.body.description;
    var tournamentImage = req.file
      ? `${fileSuffix}-${req.file.originalname}`
      : "";

    const result = validate.createTournament.validate({
      sportId: sportId,
      name: name,
      cityId: cityId,
      groundName: groundName,
      organiserName: organiserName,
      tournamentStartDate: tournamentStartDate,
      tournamentCategoryId: tournamentCategoryId,
      tournamentMatchTypeId: tournamentMatchTypeId,
      tournamentEndDate: tournamentEndDate,
      officials: officials,
      moreTeams: moreTeams,
      winningPrizeId: winningPrizeId,
      matchOnId: matchOnId,
      description: description,
    });
    if (result.error) {
      return res.status(400).json({
        msg: result.error.details[0].message,
      });
    } else {
      if (err) {
        console.log(err);
      }

      const customTournament = await CustomTournament.create({
        sportId: sportId,
        name: name,
        cityId: cityId,
        groundName: groundName,
        organiserName: organiserName,
        tournamentStartDate: tournamentStartDate,
        tournamentCategoryId: tournamentCategoryId,
        tournamentMatchTypeId: tournamentMatchTypeId,
        tournamentEndDate: tournamentEndDate,
        officials: officials,
        moreTeams: moreTeams,
        winningPrizeId: winningPrizeId,
        matchOnId: matchOnId,
        description: description,
        tournamentImage: tournamentImage,
      })
        .then(function (resp) {
          return apiResponse({
            res,
            status: true,
            data: resp,
            message: "Tournament create successfully!",
            statusCode: StatusCodes.OK,
          });
        })
        .catch(function (err) {
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
const listTournament = async (req, res) => {
  const { page = 1, size = 10, search } = req.query;

  const getPagination = (page, size) => {
    const limit = size ? +size : 10;
    const offset = page ? (page - 1) * limit : 0;
    return { limit, offset };
  };

  const getPagingData = async (totalItems, data, page, limit) => {
    const currentPage = page ? +page : 1;
    const totalPages = Math.ceil(totalItems / limit);
    return { totalItems, data, totalPages, currentPage };
  };

  try {
    let condition = {};
    if (search) {
      condition = {
        name: { $regex: new RegExp(search), $options: "i" },
      };
    }

    const { limit, offset } = getPagination(page, size);

    const data = await CustomTournament.find(condition)
      .skip(offset)
      .limit(limit)
      .exec();

    const totalItems = await CustomTournament.countDocuments(condition);

    const response = await getPagingData(totalItems, data, page, limit);

    return apiResponse({
      res,
      status: true,
      data: response,
      message: "Tournament fetch successfully!",
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

const tournamentupdate = async (req, res, next) => {
  const id = req.params.id;
  let fileSuffix = Date.now().toString();
  
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      // Specify the destination directory where files will be uploaded.
      const uploadDir = path.join("../public/tournament");
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
  
  const upload = multer({ storage: storage }).single("tournamentImage");

  upload(req, res, async function (err, file, cb) {
    var sportId = req.body.sportId;
    var name = req.body.name;
    var cityId = req.body.cityId;
    var groundName = req.body.groundName;
    var organiserName = req.body.organiserName;
    var tournamentStartDate = req.body.tournamentStartDate;
    var tournamentEndDate = req.body.tournamentEndDate;
    var tournamentCategoryId = req.body.tournamentCategoryId;
    var tournamentMatchTypeId = req.body.tournamentMatchTypeId;
    var officials = req.body.officials;
    var moreTeams = req.body.moreTeams;
    var winningPrizeId = req.body.winningPrizeId;
    var matchOnId = req.body.matchOnId;
    var description = req.body.description;
    var tournamentImage = req.file
      ? `${fileSuffix}-${req.file.originalname}`
      : "";

    const tournamentData = await CustomTournament.findById(id);
    if (tournamentData) {
      await CustomTournament.findByIdAndUpdate(
        id,
        {
          sportId,
          name,
          cityId,
          groundName,
          organiserName,
          tournamentStartDate,
          tournamentEndDate,
          tournamentCategoryId,
          tournamentMatchTypeId,
          officials,
          moreTeams,
          winningPrizeId,
          matchOnId,
          description,
          tournamentImage,
        },
        { new: true }
      )
        .then(function (resp) {
          return apiResponse({
            res,
            status: true,
            data: resp,
            message: "Tournament update successfully!",
            statusCode: StatusCodes.OK,
          });
        })
        .catch(function (err) {
          console.log(err);
          return apiResponse({
            res,
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            status: false,
            message: "Internal server error",
          });
        });
    } else {
      return apiResponse({
        res,
        statusCode: StatusCodes.NOT_FOUND,
        status: false,
        message: "Tournament not found",
      });
    }
  });
};

export default {
  createTournament,
  listTournament,
  tournamentupdate,
};
