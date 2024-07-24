import Joi from "joi";

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
  officials: Joi.string().required(),
  moreTeams: Joi.string().required(),
  winningPrizeId: Joi.string().required(),
  matchOnId: Joi.string().required(),
});

const createTeam = {
  body: Joi.object().keys({
    teamName: Joi.string().required(),
    city: Joi.string().required(),
    addMySelfInTeam: Joi.boolean().required(),
    teamImage: Joi.string().optional(),
  }),
};

const updateTeam = {
  body: Joi.object().keys({
    teamName: Joi.string(),
    city: Joi.string(),
    addMySelfInTeam: Joi.boolean(),
    teamImage: Joi.string(),
  }),
};

const createMatch = Joi.object().keys({
  tournamentId: Joi.string().required(),
  homeTeamId: Joi.string().required(),
  awayTeamId: Joi.string().required(),
  noOfOvers: Joi.number().required(),
  overPerBowler: Joi.number().required(),
  city: Joi.string().required(),
  ground: Joi.string().required(),
  dateTime: Joi.date().required(),
  pitchType: Joi.string().required(),
  ballType: Joi.string().required(),
});

const createPlayer = Joi.object().keys({
  playerName: Joi.string().required(),
  jerseyNumber: Joi.string().required(),
  role: Joi.string().required(),
  teamId: Joi.string().required(),
});

export default {
  createTournament,
  createTeam,
  createMatch,
  createPlayer,
  updateTeam,
};
