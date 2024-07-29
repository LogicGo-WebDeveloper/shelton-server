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
    const umpireIds = req.body.umpireId.replace(/^'(.*)'$/, "$1");

    // Parse the string into an array
    const array = JSON.parse(umpireIds);
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
          moreTeams: 0,
          winningPrizeId: winningPrizeId,
          matchOnId: matchOnId,
          description: description,
          tournamentImage: tournamentImage,
          tournamentBackgroundImage: tournamentBackgroundImage,
        })

          .then(async function (resp) {
            array.forEach((umpireId) => {
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
          statusCode: StatusCodes.OK,
        });
      }
    }
  });
};

const listTournament = async (req, res) => {
  const { page = 1, size = 10, search } = req.query;

  try {
    // Pagination parameters
    const limit = parseInt(size);
    const skip = (page - 1) * size;

    // Build query conditions based on search and userId
    const condition = {};
    if (search) {
      condition.name = { $regex: new RegExp(search, "i") };
    }
    if (req.headers.authorization) {
      const decodedToken = await helper.verifyToken(
        req.headers.authorization.split(" ")[1]
      );
      if (decodedToken.userId) {
        condition.createdBy = decodedToken.userId;
      }
    }

    // Query CustomTournament collection with conditions
    const tournamentsQuery = CustomTournament.find(condition)
      .populate("sportId", "sportName")
      .populate("cityId", "city")
      .populate("winningPrizeId", "name")
      .populate("matchOnId", "name")
      .populate("tournamentMatchTypeId", "name")
      .populate("tournamentCategoryId", "name");

    // Execute the query with pagination
    const tournaments = await tournamentsQuery.skip(skip).limit(limit).exec();

    const fetchCustomMatchOfficials = async (umpireIds) => {
      return CustomMatchOfficial.find({
        _id: { $in: umpireIds },
      }).exec();
    };

    const tournamentsWithUmpire = await Promise.all(
      tournaments.map(async (tournament) => {
        // Fetch umpire data for the current tournament
        const umpireData = await customUmpireList
          .find({ tournamentId: tournament._id })
          .exec();

        // Extract umpireIds from the fetched umpire data
        const umpireIds = umpireData.map((umpire) => umpire.umpireId);

        // Fetch CustomMatchOfficial data for the extracted umpireIds
        const customMatchOfficials = await fetchCustomMatchOfficials(umpireIds);

        // Create a map for quick lookup of CustomMatchOfficial data by umpireId
        const customMatchOfficialsMap = customMatchOfficials.reduce(
          (acc, official) => {
            acc[official._id.toString()] = official;
            return acc;
          },
          {}
        );

        // Attach umpire data and their corresponding CustomMatchOfficial data to the tournament object
        const enrichedUmpireData = umpireData.map((umpire) => ({
          ...umpire.toObject(),
          customMatchOfficial:
            customMatchOfficialsMap[umpire.umpireId.toString()] || null,
        }));

        return {
          ...tournament.toObject(), // Convert Mongoose document to a plain object
          umpire: enrichedUmpireData, // Add enriched umpire data
        };
      })
    );
    const totalItems = await CustomTournament.countDocuments(condition);

    // Modify tournament image URLs
    const fullUrl = req.protocol + "://" + req.get("host") + "/images/";
    tournaments.forEach((tournament) => {
      tournament.tournamentImage = tournament.tournamentImage
        ? fullUrl + "tournament/" + tournament.tournamentImage
        : "";
      tournament.tournamentBackgroundImage =
        tournament.tournamentBackgroundImage
          ? fullUrl + "tournament/" + tournament.tournamentBackgroundImage
          : "";
    });

    // Prepare paging data
    const totalPages = Math.ceil(totalItems / limit);
    const currentPage = page;

    // Response data
    const responseData = {
      totalItems,
      data: tournamentsWithUmpire,
      totalPages,
      currentPage,
    };

    // Send API response
    return apiResponse({
      res,
      status: true,
      data: responseData,
      message: "Tournament fetch successful!",
      statusCode: StatusCodes.OK,
    });
  } catch (err) {
    console.error("Error fetching tournaments:", err);
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
  const tournamentData = await CustomTournament.findById(id);
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
      : tournamentData.tournamentBackgroundImage;
    var tournamentImage = req.files.tournamentImages
      ? `${fileSuffix}-${req.files.tournamentImages[0].originalname}`
      : tournamentData.tournamentImage;

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
            : tournamentData.tournamentBackgroundImage;
          resp.tournamentBackgroundImage = resp.tournamentBackgroundImage
            ? fullUrl + "tournament/" + resp.tournamentBackgroundImage
            : tournamentData.tournamentImage;
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
    const { tournamentId } = req.query; // Assuming tournamentId is passed as a query parameter

    if (tournamentId) {
      // Fetch umpires from CustomUmpires collection based on tournamentId
      const umpiresFromCustomUmpires = await customUmpireList.find({
        tournamentId: tournamentId,
      });

      // If no umpires found for the given tournamentId, handle it accordingly
      if (umpiresFromCustomUmpires.length === 0) {
        return apiResponse({
          res,
          statusCode: StatusCodes.NOT_FOUND,
          status: false,
          message: "No umpires found for the given tournamentId",
        });
      }

      // Extract umpireIds from the results
      const umpireIds = umpiresFromCustomUmpires.map(
        (umpire) => umpire.umpireId
      );

      // Fetch umpire details from CustomMatchOfficial using the extracted umpireIds
      const umpireDetails = await CustomMatchOfficial.find({
        _id: { $in: umpireIds },
      });

      if (umpireDetails.length > 0) {
        return apiResponse({
          res,
          statusCode: StatusCodes.OK,
          status: true,
          message: "Umpires fetched successfully!",
          data: {
            tournamentId: tournamentId, // Include tournamentId in the response
            umpires: umpireDetails,
          },
        });
      } else {
        return apiResponse({
          res,
          statusCode: StatusCodes.NOT_FOUND,
          status: false,
          message: "No umpire details found",
        });
      }
    } else {
      // If tournamentId is not present, fetch umpires from CustomMatchOfficial collection
      const umpireList = await CustomMatchOfficial.find();

      if (umpireList.length > 0) {
        return apiResponse({
          res,
          statusCode: StatusCodes.OK,
          status: true,
          message: "Umpires fetched successfully!",
          data: {
            tournamentId: null, // Indicate that no specific tournamentId was used
            umpires: umpireList,
          },
        });
      } else {
        return apiResponse({
          res,
          statusCode: StatusCodes.NOT_FOUND,
          status: false,
          message: "No data found",
        });
      }
    }
  } catch (error) {
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
