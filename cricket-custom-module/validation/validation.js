import Joi from "joi";
import enums from "../../config/enum.js";

const createTournament = {
  body: Joi.object().keys({
    sportId: Joi.string().required(),
    name: Joi.string().required(),
    cityId: Joi.string().required(),
    groundName: Joi.string().required(),
    organiserName: Joi.string().required(),
    tournamentStartDate: Joi.date().required(),
    tournamentEndDate: Joi.date().required(),
    tournamentCategoryId: Joi.string().required(),
    moreTeams: Joi.string().required(),
    winningPrizeId: Joi.string().required(),
    matchOnId: Joi.string().required(),
    description: Joi.string().required(),
    tournamentImages: Joi.string(),
    tournamentBackgroundImage: Joi.string(),
  }),
};

const createTeam = {
  body: Joi.object().keys({
    teamName: Joi.string().required(),
    city: Joi.string().required(),
    teamImage: Joi.string().optional(),
    tournamentId: Joi.string().required(),
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
    umpires: Joi.array().items(Joi.string()).max(5).required(),
    homeTeamScore: Joi.object().keys({
      runs: Joi.number().default(0),
      overs: Joi.number().default(0),
      wickets: Joi.number().default(0),
    }),
    awayTeamScore: Joi.object().keys({
      runs: Joi.number().default(0),
      overs: Joi.number().default(0),
      wickets: Joi.number().default(0),
    }),
  }),
};

const updateMatch = {
  body: Joi.object().keys({
    homeTeamId: Joi.string(),
    awayTeamId: Joi.string(),
    tournamentId: Joi.string(),
    noOfOvers: Joi.number(),
    overPerBowler: Joi.number(),
    city: Joi.string(),
    ground: Joi.string(),
    dateTime: Joi.date(),
    homeTeamPlayingPlayer: Joi.array().items(Joi.string()).min(11),
    awayTeamPlayingPlayer: Joi.array().items(Joi.string()).min(11),
    umpires: Joi.array().items(Joi.string()).max(5),
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
    teamId: Joi.string(),
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

const createPlayerStandingMatch = {
  body: Joi.object().keys({
    matchId: Joi.string().required(),
    battingPlayerId: Joi.string().required(),
    score: Joi.number().default(0),
    totalScore: Joi.number().default(0),
    bowlerId: Joi.string().required(),
    six: Joi.number().default(0),
    four: Joi.number().default(0),
  }),
};

const updatePlayerStandingMatch = {
  body: Joi.object().keys({
    matchId: Joi.string(),
    battingPlayerId: Joi.string(),
    score: Joi.number(),
    totalScore: Joi.number(),
    bowlerId: Joi.string(),
    six: Joi.number(),
    four: Joi.number(),
  }),
};

const createCustomPlayerOvers = {
  body: Joi.object().keys({
    playerScoreCardId: Joi.string().required(),
    battingPlayerId: Joi.string().required(),
    balls: Joi.number().default(0),
    runs: Joi.number().default(0),
    levels: Joi.string(),
    bowlerId: Joi.string(),
    wicketTypeId: Joi.string(),
    overs_finished: Joi.boolean(),
    noBall: Joi.boolean(),
    whiteBall: Joi.boolean(),
    lbBall: Joi.boolean(),
    byeBall: Joi.boolean(),
    isOut: Joi.boolean(),
    oversNumber: Joi.number().default(0),
  }),
};

const updateCustomPlayerOvers = {
  body: Joi.object().keys({
    playerScoreCardId: Joi.string(),
    battingPlayerId: Joi.string(),
    balls: Joi.number(),
    runs: Joi.number(),
    levels: Joi.string(),
    bowlerId: Joi.string(),
    wicketTypeId: Joi.string(),
    overs_finished: Joi.boolean(),
    noBall: Joi.boolean(),
    whiteBall: Joi.boolean(),
    lbBall: Joi.boolean(),
    byeBall: Joi.boolean(),
    isOut: Joi.boolean(),
    oversNumber: Joi.number(),
  }),
};

const updateTossStatus = {
  body: Joi.object().keys({
    matchId: Joi.string().required(),
    tournamentId: Joi.string().required(),
    tossWinnerTeamId: Joi.string().required(),
    tossWinnerChoice: Joi.string()
      .valid(enums.tossChoiceEnum.BATTING, enums.tossChoiceEnum.FIELDING)
      .required(),
  }),
};

const updatePlayerStatus = {
  body: Joi.object().keys({
    status: Joi.string().valid(
      ...Object.values(enums.matchScorecardStatusEnum)
    ),
    activeBowler: Joi.boolean(),
    activeStriker: Joi.boolean(),
  }),
};

export default {
  createTournament,
  createTeam,
  createMatch,
  updateMatch,
  createPlayer,
  updateTeam,
  createUmpire,
  updatePlayer,
  updateStatus,
  createPlayerStandingMatch,
  updatePlayerStandingMatch,
  createCustomPlayerOvers,
  updateCustomPlayerOvers,
  updateTossStatus,
  updatePlayerStatus,
};
