import { v4 as uuidv4 } from "uuid";
import config from "../../config/config.js";
import helper from "../../helper/common.js";
import { uploadFile } from "../../helper/aws_s3.js";
import { apiResponse } from "../../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import FootballTournamentModel from "../model/tournament.model.js";

const createTournament = async (req, res) => {
  try {
    const {
      name,
      ground,
      organizerName,
      organizerEmail,
      startDate,
      endDate,
      description,
      winningPrizeId,
      sportId,
      tournamentCategoryId,
      matchOnId,
      cityId,
    } = req.body;

    let imageName, backgroundImageName;
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

    const existingTournament = await FootballTournamentModel.findOne({ name });
    if (existingTournament) {
      return apiResponse({
        res,
        status: false,
        message: "Tournament name already exists!",
        statusCode: StatusCodes.OK,
      });
    }

    const result = await FootballTournamentModel.create({
      name,
      ground,
      organizerName,
      organizerEmail,
      startDate,
      endDate,
      description,
      winningPrizeId,
      sportId,
      tournamentCategoryId,
      matchOnId,
      cityId,
      tournamentImage: imageName,
      backgroundImage: backgroundImageName,
    });

    return apiResponse({
      res,
      status: true,
      data: result,
      message: "Tournament created successfully!",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    console.error(error);
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const getTournaments = async (req, res) => {
  try {
  } catch (error) {}
};

const updateTournament = async (req, res) => {
  try {
  } catch (error) {}
};

export default {
  createTournament,
  getTournaments,
  updateTournament,
};
