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

const createMatch = {
  body: Joi.object().keys({
    homeTeamId: Joi.string().required(),
    awayTeamId: Joi.string().required(),
    noOfOvers: Joi.number().required(),
    overPerBowler: Joi.number().required(),
    city: Joi.string().required(),
    ground: Joi.string().required(),
    dateTime: Joi.date().required(),
    pitchType: Joi.string().required(),
    ballType: Joi.string().required(),
  }),
};

const createPlayer = {
  body: Joi.object().keys({
    playerName: Joi.string().required(),
    phoneNumber: Joi.string().required(),
    role: Joi.string().required(),
    image: Joi.string().optional(),
  }),
};

const updatePlayer = {
  body: Joi.object().keys({
    playerName: Joi.string(),
    phoneNumber: Joi.string(),
    role: Joi.string(),
    image: Joi.string().optional(),
  }),
};

export default {
  createTournament,
  createTeam,
  createMatch,
  createPlayer,
  updateTeam,
  updatePlayer
};
