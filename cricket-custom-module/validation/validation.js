import Joi from "joi";
import enums from "../../config/enum.js";

const createTournament = Joi.object().keys({
  sportId: Joi.string().required(),
  name: Joi.string().required(),
  cityId: Joi.string().required(),
  groundName: Joi.string().required(),
  organiserName: Joi.string().required(),
  tournamentStartDate: Joi.date().required(),
  tournamentEndDate: Joi.date().required(),
  tournamentCategoryId: Joi.string().required(),
  tournamentMatchTypeId: Joi.string().required(),
  moreTeams: Joi.string().required(),
  winningPrizeId: Joi.string().required(),
  matchOnId: Joi.string().required(),
});

const createTeam = {
  body: Joi.object().keys({
    teamName: Joi.string().required(),
    city: Joi.string().required(),
    teamImage: Joi.string().optional(),
    tournamentId: Joi.string(),
  }),
};

const updateTeam = {
  body: Joi.object().keys({
    teamName: Joi.string(),
    city: Joi.string(),
    teamImage: Joi.string(),
    tournamentId: Joi.string(),
  }),
};

const createMatch = {
  body: Joi.object().keys({
    homeTeamId: Joi.string().required(),
    awayTeamId: Joi.string().required(),
    tournamentId: Joi.string().required(),
    noOfOvers: Joi.number().required(),
    overPerBowler: Joi.number().required(),
    city: Joi.string().required(),
    ground: Joi.string().required(),
    dateTime: Joi.date().required(),
    homeTeamPlayingPlayer: Joi.array().items(Joi.string()).min(11).required(),
    awayTeamPlayingPlayer: Joi.array().items(Joi.string()).min(11).required(),
  }),
};

const createPlayer = {
  body: Joi.object().keys({
    playerName: Joi.string().required(),
    jerseyNumber: Joi.number().required(),
    role: Joi.string().required(),
    image: Joi.string().optional(),
    teamId: Joi.string().required(),
  }),
};

const updatePlayer = {
  body: Joi.object().keys({
    playerName: Joi.string(),
    jerseyNumber: Joi.number(),
    role: Joi.string(),
    image: Joi.any().optional(),
    teamId: Joi.string().required(),
  }),
};

const createUmpire = Joi.object().keys({
  name: Joi.string().required(),
});

const updateStatus = {
  body: Joi.object().keys({
    status: Joi.string().valid(...Object.values(enums.matchStatusEnum)),
  }),
};

export default {
  createTournament,
  createTeam,
  createMatch,
  createPlayer,
  updateTeam,
  createUmpire,
  updatePlayer,
  updateStatus
};
