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
    teamImage: Joi.string().allow(null, "").optional(),
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

const createBasketballMatch = {
  body: Joi.object().keys({
    homeTeamId: Joi.string().required(),
    awayTeamId: Joi.string().required(),
    tournamentId: Joi.string().optional().allow(null, ""),
    period: Joi.number().min(1).max(4).required(),
    eachLasting: Joi.number().valid(10, 12).required(),
    location: Joi.string().required(),
    gameContractor: Joi.string().required(),
    dateTime: Joi.date().required(),
    status: Joi.string().valid("not_started", "in_progress").required(),
    homeTeamPlayers: Joi.array()
      .items(
        Joi.object({
          playerId: Joi.string().required(),
          isPlaying: Joi.boolean().required(),
        })
      )
      .min(5)
      .max(15)
      .required(),
    awayTeamPlayers: Joi.array()
      .items(
        Joi.object({
          playerId: Joi.string().required(),
          isPlaying: Joi.boolean().required(),
        })
      )
      .min(5)
      .max(15)
      .required(),
  }),
};

const updateBasketballMatch = {
  body: Joi.object().keys({
    homeTeamId: Joi.string().optional(),
    awayTeamId: Joi.string().optional(),
    tournamentId: Joi.string().optional().allow(null, ""),
    period: Joi.number().min(1).max(4).optional(),
    eachLasting: Joi.number().valid(10, 12).optional(),
    location: Joi.string().optional(),
    gameContractor: Joi.string().optional(),
    dateTime: Joi.date().optional(),
    status: Joi.string().valid("not_started", "in_progress").optional(),
    homeTeamPlayers: Joi.array().items(
      Joi.object({
        playerId: Joi.string().required(),
        isPlaying: Joi.boolean().required(),
      })
    ).optional(),
    awayTeamPlayers: Joi.array().items(
      Joi.object({
        playerId: Joi.string().required(),
        isPlaying: Joi.boolean().required(),
      })
    ).optional(),
  }),
};

export default {
  createBasketballTournament,
  createBasketballTeam,
  updateBasketballTeam,
  createBasketballPlayer,
  updateBasketballPlayer,
  createBasketballMatch,
  updateBasketballMatch,
};
