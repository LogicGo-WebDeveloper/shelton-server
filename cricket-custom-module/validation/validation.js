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
  description: Joi.string().required(),
});

export default {
  createTournament,
};
