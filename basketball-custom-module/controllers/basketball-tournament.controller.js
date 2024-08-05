import { StatusCodes } from "http-status-codes";
import CustomBasketballTournament from "../models/basketball-tournament.models.js";
import { apiResponse } from "../../helper/apiResponse.js";
import { uploadFile } from "../../helper/aws_s3.js";
import mongoose from "mongoose";
import helper from "../../helper/common.js";
import { v4 as uuidv4 } from "uuid";
import config from "../../config/config.js";
import { validateEntitiesExistence, validateObjectIds } from "../../cricket-custom-module/utils/utils.js";
import { CustomCityList, CustomTournamentCategory } from "../../cricket-custom-module/models/common.models.js";
import CustomSportList from "../../cricket-custom-module/models/sport.models.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const createBasketballTournament = async (req, res) => {
  const {
    sportId,
    name,
    cityId,
    groundName, 
    organiserName,
    organiserEmail,
    tournamentStartDate,
    tournamentEndDate,
    tournamentCategoryId,
  } = req.body;
  const { tournamentImages, tournamentBackgroundImage } = req.files;

  const requiredFields = [
    "sportId",
    "name",
    "cityId",
    "groundName",
    "organiserName",
    "organiserEmail",
    "tournamentStartDate",
    "tournamentEndDate",
    "tournamentCategoryId",

  ];

  let missingFields = {};
  requiredFields.forEach((field) => {
    if (!req.body[field]) {
      missingFields[field] = `${field} is required`;
    }
  });

  // Add validation for tournamentImages and tournamentBackgroundImage
  if (!tournamentImages || tournamentImages.length === 0) {
    missingFields["tournamentImages"] = "Tournament images are required";
  }
  if (!tournamentBackgroundImage || tournamentBackgroundImage.length === 0) {
    missingFields["tournamentBackgroundImage"] = "Tournament background image is required";
  }

  // Add email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (organiserEmail && !emailRegex.test(organiserEmail)) {
    missingFields["organiserEmail"] = "Invalid email format";
  }

  if (Object.keys(missingFields).length > 0) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: missingFields,
      body: null,
      status: false,
    });
  }

  // Add this validation
  if (new Date(tournamentEndDate) <= new Date(tournamentStartDate)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Tournament end date must be after the start date",
      body: null,
      status: false,
    });
  }

  try {

    const validation = validateObjectIds({ sportId, cityId, tournamentCategoryId });
    if (!validation.isValid) {
      return apiResponse({
        res,
        status: false,
        message: validation.message,
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    // Validate if the teams and players exist
    const entitiesToValidate = [
      { model: CustomSportList, id: sportId, name: "Sport" },
      { model: CustomCityList, id: cityId, name: "City" },
      { model: CustomTournamentCategory, id: tournamentCategoryId, name: "Tournament category" },
    ];

    const validationErrors = await validateEntitiesExistence(
      entitiesToValidate
    );

    if (validationErrors.length > 0) {
      return apiResponse({
        res,
        status: true,
        message: validationErrors.join(", "),
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    const tournamentsData = await CustomBasketballTournament.findOne({ name });

    if (tournamentsData) {
      return apiResponse({
        res,
        status: false,
        message: "Tournament name already exists!",
        statusCode: StatusCodes.OK,
      });
    }

    let imageName, backgroundImageName;

    if (tournamentImages && tournamentImages.length > 0) {
      const imageBuffer = tournamentImages[0].buffer;
      const filename = `${uuidv4()}.${tournamentImages[0].originalname
        .split(".")
        .pop()}`;
      await uploadFile({
        filename: `${config.cloud.digitalocean.rootDirname}/custom_tournament/${filename}`,
        file: imageBuffer,
        ACL: "public-read",
      });
      imageName = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/custom_tournament/${filename}`;
    }

    if (tournamentBackgroundImage && tournamentBackgroundImage.length > 0) {
      const backgroundImageBuffer = tournamentBackgroundImage[0].buffer;
      const backgroundFilename = `${uuidv4()}.${tournamentBackgroundImage[0].originalname
        .split(".")
        .pop()}`;
      await uploadFile({
        filename: `${config.cloud.digitalocean.rootDirname}/custom_tournament/${backgroundFilename}`,
        file: backgroundImageBuffer,
        ACL: "public-read",
      });
      backgroundImageName = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/custom_tournament/${backgroundFilename}`;
    }

    const newTournament = await CustomBasketballTournament.create({
      createdBy: req.user._id,
      sportId,
      name,
      cityId,
      groundName,
      organiserName,
      tournamentStartDate,
      tournamentEndDate,
      tournamentCategoryId,
      organiserEmail,
      tournamentImage: imageName,
      tournamentBackgroundImage: backgroundImageName,
    });

    return apiResponse({
      res,
      status: true,
      data: newTournament,
      message: "Tournament created successfully!",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    console.error(error);
    return apiResponse({
      res,
      status: false,
      message: "Internal server error",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const basketballTournamentList = async (req, res) => {
  const { page = 1, size = 10, search, ...extraQueryParams } = req.query;

  try {
    if (Object.keys(extraQueryParams).length > 0) {
      return apiResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: "Data not found",
        status: false,
      });
    }

    const limit = parseInt(size);
    const skip = (page - 1) * size;

    const condition = {};
    if (search) {
      condition.name = { $regex: new RegExp(search, "i") };
    }

    if (req.headers.authorization) {
      const decodedToken = await helper.verifyToken(
        req.headers.authorization.split(" ")[1]
      );
      if (decodedToken.userId && decodedToken.role !== "admin") {
        condition.createdBy = decodedToken.userId;
      }
    }

    const tournamentsQuery = CustomBasketballTournament.find(condition)
      .populate("sportId", "sportName")
      .populate("cityId", "city")
      .populate("tournamentCategoryId", "name");

    const tournaments = await tournamentsQuery.skip(skip).limit(limit).exec();
    const totalItems = await CustomBasketballTournament.countDocuments(condition);

    const totalPages = Math.ceil(totalItems / limit);
    const currentPage = page;

    const responseData = {
      totalItems,
      data: tournaments,
      totalPages,
      currentPage,
    };

    return apiResponse({
      res,
      status: true,
      data: responseData,
      message: "Basketball tournaments fetched successfully!",
      statusCode: StatusCodes.OK,
    });
  } catch (err) {
    console.error("Error fetching basketball tournaments:", err);
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const updateBasketballTournament = async (req, res) => {
  const { id } = req.params;
  const {
    sportId,
    name,
    cityId,
    groundName,
    organiserName,
    organiserEmail,
    tournamentStartDate,
    tournamentEndDate,
    tournamentCategoryId,
  } = req.body;
  const { tournamentImages, tournamentBackgroundImage } = req.files;

  try {
    const tournamentData = await CustomBasketballTournament.findById(id);
    if (!tournamentData) {
      return apiResponse({
        res,
        status: true,
        message: "Tournament not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    // Validate provided IDs
    if (sportId && !isValidObjectId(sportId)) {
      return apiResponse({
        res,
        status: false,
        message: "Invalid sportId",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }
    if (cityId && !isValidObjectId(cityId)) {
      return apiResponse({
        res,
        status: false,
        message: "Invalid cityId",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }
    if (tournamentCategoryId && !isValidObjectId(tournamentCategoryId)) {
      return apiResponse({
        res,
        status: false,
        message: "Invalid tournamentCategoryId",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    // Check if the provided IDs exist in the database
    if (sportId) {
      const sport = await CustomSportList.findById(sportId);
      if (!sport) {
        return apiResponse({
          res,
          status: true,
          message: "Sport not found",
          statusCode: StatusCodes.NOT_FOUND,
        });
      }
    }
    if (cityId) {
      const city = await CustomCityList.findById(cityId);
      if (!city) {
        return apiResponse({
          res,
          status: true,
          message: "City not found",
          statusCode: StatusCodes.NOT_FOUND,
        });
      }
    }
    if (tournamentCategoryId) {
      const category = await CustomTournamentCategory.findById(tournamentCategoryId);
      if (!category) {
        return apiResponse({
          res,
          status: true,
          message: "Tournament category not found",
          statusCode: StatusCodes.NOT_FOUND,
        });
      }
    }

    // Validate email
    if (organiserEmail && !isValidEmail(organiserEmail)) {
      return apiResponse({
        res,
        status: false,
        message: "Invalid email format",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    // Validate dates
    if (tournamentStartDate && tournamentEndDate && new Date(tournamentEndDate) <= new Date(tournamentStartDate)) {
      return apiResponse({
        res,
        status: false,
        message: "Tournament end date must be after the start date",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    let imageName = tournamentData.tournamentImage;
    let backgroundImageName = tournamentData.tournamentBackgroundImage;

    if (tournamentImages && tournamentImages.length > 0) {
      const imageBuffer = tournamentImages[0].buffer;
      const filename = `${uuidv4()}.${tournamentImages[0].originalname.split(".").pop()}`;
      await uploadFile({
        filename: `${config.cloud.digitalocean.rootDirname}/custom_tournament/${filename}`,
        file: imageBuffer,
        ACL: "public-read",
      });
      imageName = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/custom_tournament/${filename}`;
    }

    if (tournamentBackgroundImage && tournamentBackgroundImage.length > 0) {
      const backgroundImageBuffer = tournamentBackgroundImage[0].buffer;
      const backgroundFilename = `${uuidv4()}.${tournamentBackgroundImage[0].originalname.split(".").pop()}`;
      await uploadFile({
        filename: `${config.cloud.digitalocean.rootDirname}/custom_tournament/${backgroundFilename}`,
        file: backgroundImageBuffer,
        ACL: "public-read",
      });
      backgroundImageName = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/custom_tournament/${backgroundFilename}`;
    }

    const updatedData = {
      sportId: sportId || tournamentData.sportId,
      name: name || tournamentData.name,
      cityId: cityId || tournamentData.cityId,
      groundName: groundName || tournamentData.groundName,
      organiserName: organiserName || tournamentData.organiserName,
      organiserEmail: organiserEmail || tournamentData.organiserEmail,
      tournamentStartDate: tournamentStartDate || tournamentData.tournamentStartDate,
      tournamentEndDate: tournamentEndDate || tournamentData.tournamentEndDate,
      tournamentCategoryId: tournamentCategoryId || tournamentData.tournamentCategoryId,
      tournamentImage: imageName,
      tournamentBackgroundImage: backgroundImageName,
    };

    const updatedTournament = await CustomBasketballTournament.findByIdAndUpdate(id, updatedData, { new: true });

    return apiResponse({
      res,
      status: true,
      data: updatedTournament,
      message: "Tournament updated successfully!",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    console.error(error);
    return apiResponse({
      res,
      status: false,
      message: "Internal server error",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

export default {
  createBasketballTournament,
  basketballTournamentList,
  updateBasketballTournament
};
