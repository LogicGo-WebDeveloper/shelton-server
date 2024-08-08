const nodeEnvEnums = {
  PRODUCTION: "production",
  DEVELOPMENT: "development",
};

const userRoleEnum = {
  USER: "user",
  ADMIN: "admin",
};

const authProviderEnum = {
  GOOGLE: "google",
  APPLE: "apple",
  EMAIL: "email",
  MOBILE: "mobile",
};

const discountTypeEnum = {
  FIXED: "fixed",
  PERCENTAGE: "percentage",
};

const sofascoreApiModeEnum = {
  FREE: "free",
  PAID: "paid",
};

//don't change the order of the status because it is used in match filter
const matchStatusEnum = {
  in_progress: "in_progress",
  not_started: "not_started",
  finished: "finished",
  cancelled: "cancelled",
  abandoned: "abandoned",
  draw: "draw",
  started: "started",
};

const tossChoiceEnum = {
  FIELDING: "fielding",
  BATTING: "batting",
};

const matchScorecardStatusEnum = {
  not_out: "not_out",
  out: "out",
  yet_to_bat: "yet_to_bat"
};

export default {
  nodeEnvEnums,
  userRoleEnum,
  authProviderEnum,
  discountTypeEnum,
  sofascoreApiModeEnum,
  matchStatusEnum,
  tossChoiceEnum,
  matchScorecardStatusEnum,
};
