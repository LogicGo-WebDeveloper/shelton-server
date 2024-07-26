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

const matchStatusEnum = {
  in_progress: "in_progress",
  not_started: "not_started",
  finished: "finished",
  cancelled: "cancelled",
};

const tossChoiceEnum = {
  FIELDING: "fielding",
  BATTING: "batting",
};

export default {
  nodeEnvEnums,
  userRoleEnum,
  authProviderEnum,
  discountTypeEnum,
  sofascoreApiModeEnum,
  matchStatusEnum,
  tossChoiceEnum,
};
