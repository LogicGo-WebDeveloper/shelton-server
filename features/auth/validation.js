import Joi from "joi";

const verifyToken = {
  body: Joi.object({
    token: Joi.string().required(),
  }),
};

const registerByEmail = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    name: Joi.string().required(),
  }),
};

const registerByMobile = {
  body: Joi.object().keys({
    mobileNumber: Joi.number().required(),
    password: Joi.string().required(),
  }),
};

const loginByEmail = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

const loginByMobile = {
  body: Joi.object().keys({
    mobileNumber: Joi.number().required(),
    password: Joi.string().required(),
  }),
};

const loginByGoogle = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    name: Joi.string().required(),
  }),
};

const forgotPasswordEmail = {
  body: Joi.object().keys({
    email: Joi.string().email().lowercase().required(),
  }),
};

const forgotPasswordMobile = {
  body: Joi.object().keys({
    mobileNumber: Joi.number().required(),
  }),
};

const verifyEmailOTP = {
  body: Joi.object().keys({
    otp: Joi.number().required(),
    email: Joi.string().email().required(),
  }),
};

const verifyMobileOTP = {
  body: Joi.object().keys({
    otp: Joi.number().integer().required(),
    mobileNumber: Joi.number().required(),
  }),
};

const resendEmailOTP = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};
const resendMobileOTP = {
  body: Joi.object().keys({
    mobileNumber: Joi.number().required(),
  }),
};

const changePassword = {
  body: Joi.object().keys({
    oldPassword: Joi.string().label("Old password").required(),
    newPassword: Joi.string().label("New password").required(),
    confirmNewPassword: Joi.string().valid(Joi.ref("newPassword")).required(),
  }),
};

const resetPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().required().label("password"),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
  }),
};

export default {
  verifyToken,
  registerByEmail,
  registerByMobile,
  loginByEmail,
  loginByMobile,
  loginByGoogle,
  forgotPasswordEmail,
  forgotPasswordMobile,
  verifyEmailOTP,
  verifyMobileOTP,
  resendEmailOTP,
  resendMobileOTP,
  changePassword,
  resetPassword,
};
