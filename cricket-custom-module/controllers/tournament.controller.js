import { StatusCodes } from "http-status-codes";
import validate from "../validation/validation.js";
import CustomTournament from "../models/tournament.models.js";
import { apiResponse } from "../../helper/apiResponse.js";
import { CustomMatchOfficial } from "../models/common.models.js";
import customUmpireList from "../models/umpire.models.js";
import helper from "../../helper/common.js";
import { uploadFile } from "../../helper/aws_s3.js";
import { v4 as uuidv4 } from "uuid";
import config from "../../config/config.js";

const createTournament = async (req, res, next) => {
  const {
    sportId,
    name,
    cityId,
    groundName,
    organiserName,
    tournamentStartDate,
    tournamentEndDate,
    tournamentCategoryId,
    moreTeams,
    winningPrizeId,
    matchOnId,
    description,
  } = req.body;
  const { tournamentImages, tournamentBackgroundImage } = req.files;

  const requiredFields = [
    "sportId",
    "name",
    "cityId",
    "groundName",
    "organiserName",
    "tournamentStartDate",
    "tournamentEndDate",
    "tournamentCategoryId",
    "moreTeams",
    "winningPrizeId",
    "matchOnId",
    "umpireId",
  ];

  let missingFields = {};
  requiredFields.forEach((field) => {
    if (!req.body[field]) {
      missingFields[field] = `${field} is required`;
    }
  });

  if (Object.keys(missingFields).length > 0) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: missingFields,
      body: null,
      status: false,
    });
  }

  const umpireIds = req.body.umpireId.replace(/^'(.*)'$/, "$1");
  const array = JSON.parse(umpireIds);

  try {
    const tournamentsData = await CustomTournament.findOne({ name });

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

    const newTournament = await CustomTournament.create({
      createdBy: req.user._id,
      sportId,
      name,
      cityId,
      groundName,
      organiserName,
      tournamentStartDate,
      tournamentEndDate,
      tournamentCategoryId,
      moreTeams,
      winningPrizeId,
      matchOnId,
      description,
      tournamentImage: imageName,
      tournamentBackgroundImage: backgroundImageName,
    });

    const umpireData = array.map((umpireId) => ({
      tournamentId: newTournament._id,
      umpireId,
    }));

    await customUmpireList.insertMany(umpireData);

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

const listTournament = async (req, res) => {
  const { page = 1, size = 10, search, ...extraQueryParams } = req.query;

  try {
    // Check for unexpected query parameters
    if (Object.keys(extraQueryParams).length > 0) {
      return apiResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: "Data not found",
        status: false,
      });
    }
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
  const { id } = req.params;
  const {
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
  } = req.body;
  const createdBy = req.user._id;
  let imageName, backgroundImageName;

  if (req.files) {
    const { tournamentImages, tournamentBackgroundImage } = req.files;
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
  }

  try {
    const tournamentData = await CustomTournament.findById(id);
    if (tournamentData) {
      const result = await CustomTournament.findByIdAndUpdate(
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
          tournamentImage: imageName,
          tournamentBackgroundImage: backgroundImageName,
        },
        { new: true }
      );

      return apiResponse({
        res,
        status: true,
        data: result,
        message: "Tournament updated successfully!",
        statusCode: StatusCodes.OK,
      });
    } else {
      return apiResponse({
        res,
        statusCode: StatusCodes.NOT_FOUND,
        status: false,
        message: "Tournament not found",
      });
    }
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
