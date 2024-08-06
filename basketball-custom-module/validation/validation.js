import Joi from "joi";

const createBasketballTournament = {
  body: Joi.object().keys({
    sportId: Joi.string().required(),
    name: Joi.string().required(),
    cityId: Joi.string().required(),
    groundName: Joi.string().required(),
    organiserName: Joi.string().required(),
    organiserEmail: Joi.string().required(),
    tournamentStartDate: Joi.date().required(),
    tournamentEndDate: Joi.date().required(),
    tournamentCategoryId: Joi.string().required(),
    tournamentImages: Joi.string(),
    tournamentBackgroundImage: Joi.string(),
  }),
};

const createBasketballTeam = {
  body: Joi.object().keys({
    teamName: Joi.string().required(),
    city: Joi.string().required(),
    teamImage: Joi.string().optional(),
    tournamentId: Joi.string(),
  }),
};

const updateBasketballTeam = {
  body: Joi.object().keys({
    teamName: Joi.string(),
    city: Joi.string(),
    teamImage: Joi.string().allow(null, ""),
    tournamentId: Joi.string(),
  }),
};

const createBasketballPlayer = {
  body: Joi.object().keys({
    playerName: Joi.string().required(),
    jerseyNumber: Joi.number().required(),
    role: Joi.string().required(),
    image: Joi.string().optional(),
    teamId: Joi.string().required(),
  }),
};

const updateBasketballPlayer = {
  body: Joi.object().keys({
    playerName: Joi.string(),
    jerseyNumber: Joi.number(),
    role: Joi.string(),
    image: Joi.any().optional(),
    teamId: Joi.string(),
  }),
};

export default {
  createBasketballTournament,
  createBasketballTeam,
  updateBasketballTeam,
  createBasketballPlayer,
  updateBasketballPlayer,
};
