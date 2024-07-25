// import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import * as path from "path";
import validate from "../validation/validation.js";
import CustomTournament from "../models/tournament.models.js";
import multer from "multer";
import fs from "fs";
import { apiResponse } from "../../helper/apiResponse.js";
import { CustomMatchOfficial } from "../models/common.models.js";
import customUmpireList from "../models/umpire.models.js";
import helper from "../../helper/common.js";

const createTournament = async (req, res, next) => {
  let fileSuffix = Date.now().toString();

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join("cricket-custom-module/public/tournament"); // Use absolute path
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
  const upload = multer({ storage: storage }).fields([
    { name: "tournamentImages", maxCount: 1 }, // Allow up to 5 tournament images
    { name: "tournamentBackgroundImage", maxCount: 1 }, // Allow only 1 background image
  ]);

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
    var umpireIds = req.body.umpireId;
    var moreTeams = req.body.moreTeams;
    var winningPrizeId = req.body.winningPrizeId;
    var matchOnId = req.body.matchOnId;
    var description = req.body.description;
    var tournamentBackgroundImage = req.files
      ? `${fileSuffix}-${req.files.tournamentBackgroundImage[0].originalname}`
      : "";
    var tournamentImage = req.files
      ? `${fileSuffix}-${req.files.tournamentImages[0].originalname}`
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
      moreTeams: moreTeams,
      winningPrizeId: winningPrizeId,
      matchOnId: matchOnId,
    });
    if (result.error) {
      return res.status(400).json({
        res,
        status: false,
        data: null,
        message: result.error.details[0].message,
        statusCode: StatusCodes.OK,
      });
    } else {
      if (err) {
        console.log(err);
      }

      const tournamentsData = await CustomTournament.findOne({
        name: name,
      });

      if (!tournamentsData) {
        let alldata = [];

        const customTournament = await CustomTournament.create({
          createdBy: req.user._id,
          sportId: sportId,
          name: name,
          cityId: cityId,
          groundName: groundName,
          organiserName: organiserName,
          tournamentStartDate: tournamentStartDate,
          tournamentCategoryId: tournamentCategoryId,
          tournamentMatchTypeId: tournamentMatchTypeId,
          tournamentEndDate: tournamentEndDate,
          moreTeams: moreTeams,
          winningPrizeId: winningPrizeId,
          matchOnId: matchOnId,
          description: description,
          tournamentImage: tournamentImage,
          tournamentBackgroundImage: tournamentBackgroundImage,
        })

          .then(async function (resp) {
            umpireIds.forEach((umpireId) => {
              let data = {
                tournamentId: resp.id, // Assuming resp.id is the tournamentId
                umpireId: umpireId,
              };
              alldata.push(data);
            });

            const result = await customUmpireList.insertMany(alldata);

            var fullUrl = req.protocol + "://" + req.get("host") + "/images/";
            resp.tournamentImage = resp.tournamentImage
              ? fullUrl + "tournament/" + resp.tournamentImage
              : "";
            resp.tournamentBackgroundImage = resp.tournamentBackgroundImage
              ? fullUrl + "tournament/" + resp.tournamentBackgroundImage
              : "";

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
      } else {
        return apiResponse({
          res,
          status: false,
          message: "Tournament name already exists!",
          statusCode: StatusCodes.FORBIDDEN,
        });
      }
    }
  });
};
const listTournament = async (req, res) => {
  const { page = 1, size = 10, search } = req.query;

  const authHeader = req.headers?.authorization;
  const token = authHeader ? authHeader?.split(" ")[1] : null;
  let userId;
  if (token) {
    const decodedToken = await helper.verifyToken(token);
    userId = decodedToken?.userId;
  }

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

    // Set condition based on search parameter
    if (search) {
      condition.name = { $regex: new RegExp(search), $options: "i" };
    }

    // If req.user._id is provided, filter by createdBy field
    if (userId) {
      condition.createdBy = userId;
    }

    const { limit, offset } = getPagination(page, size);

    let data;
    let totalItems;

    // Fetch tournaments based on condition
    if (Object.keys(condition).length > 0) {
      data = await CustomTournament.find(condition)
        .populate({
          path: "sportId",
          model: "CustomSportList",
          select: "sportName",
        })
        .populate({
          path: "cityId",
          model: "CustomCityList",
          select: "city",
        })
        .populate({
          path: "winningPrizeId",
          model: "CustomTournamentWinningPrize",
          select: "name",
        })
        .populate({
          path: "matchOnId",
          model: "CustomMatchOn",
          select: "name",
        })
        .populate({
          path: "tournamentMatchTypeId",
          model: "CustomMatchType",
          select: "name",
        })
        .populate({
          path: "tournamentCategoryId",
          model: "CustomTournamentCategory",
          select: "name",
        })
        // .populate({
        //   path: "_id", // Assuming `_id` is the reference field in CustomUmpire
        //   model: "CustomUmpire",
        //   select: "name", // Fields you want to select from CustomUmpire
        // })
        .skip(offset)
        .limit(limit)
        .exec();

      totalItems = await CustomTournament.countDocuments(condition);
    } else {
      // If no condition, fetch all tournaments (for cases where req.user._id is not provided)
      data = await CustomTournament.find()
        .populate({
          path: "sportId",
          model: "CustomSportList",
          select: "sportName",
        })
        .populate({
          path: "cityId",
          model: "CustomCityList",
          select: "city",
        })
        .populate({
          path: "winningPrizeId",
          model: "CustomTournamentWinningPrize",
          select: "name",
        })
        .populate({
          path: "matchOnId",
          model: "CustomMatchOn",
          select: "name",
        })
        .populate({
          path: "tournamentMatchTypeId",
          model: "CustomMatchType",
          select: "name",
        })
        .populate({
          path: "tournamentCategoryId",
          model: "CustomTournamentCategory",
          select: "name",
        })
        .populate({
          path: "_id", // Assuming `_id` is the reference field in CustomUmpire
          model: "CustomUmpire",
          select: "name", // Fields you want to select from CustomUmpire
        })
        .skip(offset)
        .limit(limit)
        .exec();

      totalItems = await CustomTournament.countDocuments();
    }

    // Modify tournament image URLs
    const fullUrl = req.protocol + "://" + req.get("host") + "/images/";
    data.forEach((element) => {
      element.tournamentImage = element.tournamentImage
        ? fullUrl + "tournament/" + element.tournamentImage
        : "";
      element.tournamentBackgroundImage = element.tournamentBackgroundImage
        ? fullUrl + "tournament/" + element.tournamentBackgroundImage
        : "";
    });

    const response = await getPagingData(totalItems, data, page, limit);

    return apiResponse({
      res,
      status: true,
      data: response,
      message: "Tournament fetch successful!",
      statusCode: StatusCodes.OK,
    });
  } catch (err) {
    console.log(err);
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const tournamentUpdate = async (req, res, next) => {
  const id = req.params.id;
  let fileSuffix = Date.now().toString();
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join("cricket-custom-module/public/tournament"); // Use absolute path
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
  const upload = multer({ storage: storage }).fields([
    { name: "tournamentImages", maxCount: 1 }, // Allow up to 5 tournament images
    { name: "tournamentBackgroundImage", maxCount: 1 }, // Allow only 1 background image
  ]);

  upload(req, res, async function (err, file, cb) {
    var createdBy = req.user._id;
    var sportId = req.body.sportId;
    var name = req.body.name;
    var cityId = req.body.cityId;
    var groundName = req.body.groundName;
    var organiserName = req.body.organiserName;
    var tournamentStartDate = req.body.tournamentStartDate;
    var tournamentEndDate = req.body.tournamentEndDate;
    var tournamentCategoryId = req.body.tournamentCategoryId;
    var tournamentMatchTypeId = req.body.tournamentMatchTypeId;
    var moreTeams = req.body.moreTeams;
    var winningPrizeId = req.body.winningPrizeId;
    var matchOnId = req.body.matchOnId;
    var description = req.body.description;
    var tournamentBackgroundImage = req.files.tournamentBackgroundImage
      ? `${fileSuffix}-${req.files.tournamentBackgroundImage[0].originalname}`
      : "";
    var tournamentImage = req.files.tournamentImages
      ? `${fileSuffix}-${req.files.tournamentImages[0].originalname}`
      : "";

    const tournamentData = await CustomTournament.findById(id);
    if (tournamentData) {
      await CustomTournament.findByIdAndUpdate(
        id,
        {
          createdBy,
          sportId,
          name,
          cityId,
          groundName,
          organiserName,
          tournamentStartDate,
          tournamentEndDate,
          tournamentCategoryId,
          tournamentMatchTypeId,
          moreTeams,
          winningPrizeId,
          matchOnId,
          description,
          tournamentImage,
          tournamentBackgroundImage,
        },
        { new: true }
      )
        .then(function (resp) {
          var fullUrl = req.protocol + "://" + req.get("host") + "/images/";
          resp.tournamentImage = resp.tournamentImage
            ? fullUrl + "tournament/" + resp.tournamentImage
            : "";
          resp.tournamentBackgroundImage = resp.tournamentBackgroundImage
            ? fullUrl + "tournament/" + resp.tournamentBackgroundImage
            : "";
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

const tournamentAddUmpire = async (req, res, next) => {
  var name = req.body.name;

  const result = validate.createUmpire.validate({
    name,
  });

  if (result.error) {
    return res.status(400).json({
      message: result.error.details[0].message,
    });
  } else {
    try {
      const upmireData = await CustomMatchOfficial.findOne({
        name: name,
      });
      if (upmireData) {
        return apiResponse({
          res,
          statusCode: StatusCodes.FORBIDDEN,
          status: false,
          message: "Umpire already exists!",
        });
      }

      const umpire = await CustomMatchOfficial.create({
        name: name,
      })
        .then((resp) => {
          return apiResponse({
            res,
            statusCode: StatusCodes.OK,
            status: true,
            message: "Umpire created successfully!",
            data: resp,
          });
        })
        .catch((error) => {
          console.log(error);
          return apiResponse({
            res,
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            status: false,
            message: "Internal server error",
          });
        });
    } catch {
      return apiResponse({
        res,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        status: false,
        message: "Internal server error",
      });
    }
  }
};

const tournamentListUmpire = async (req, res, next) => {
  try {
    const umpireList = await CustomMatchOfficial.find();
    if (umpireList) {
      return apiResponse({
        res,
        statusCode: StatusCodes.OK,
        status: true,
        message: "Umpire fetched successfully!",
        data: umpireList,
      });
    } else {
      return apiResponse({
        res,
        statusCode: StatusCodes.NOT_FOUND,
        status: false,
        message: "no data found",
      });
    }
  } catch {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

export default {
  createTournament,
  listTournament,
  tournamentUpdate,
  tournamentAddUmpire,
  tournamentListUmpire,
};
