import Joi from "joi";

/**
 * Create tournament
 */
const createTournament = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    tournamentImage: Joi.string(),
    backgroundImage: Joi.string(),
    ground: Joi.string().required(),
    organizerName: Joi.string().required(),
    organizerEmail: Joi.string().email().required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
    description: Joi.string().required(),
    winningPrizeId: Joi.string().required(),
    sportId: Joi.string().required(),
    tournamentCategoryId: Joi.string().required(),
    matchOnId: Joi.string().required(),
    cityId: Joi.string().required(),
  }),
};

/**
 * Update tournament
 */
const updateTournament = {
  body: Joi.object().keys({
    name: Joi.string(),
    tournamentImage: Joi.string(),
    backgroundImage: Joi.string(),
    ground: Joi.string(),
    organizerName: Joi.string(),
    organizerEmail: Joi.string().email(),
    startDate: Joi.date(),
    endDate: Joi.date(),
    description: Joi.string(),
    winningPrizeId: Joi.string(),
    sportId: Joi.string(),
    tournamentCategoryId: Joi.string(),
    matchOnId: Joi.string(),
    cityId: Joi.string(),
  }),
};

export default { createTournament, updateTournament };
