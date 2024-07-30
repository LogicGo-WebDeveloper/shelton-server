import bcrypt from "bcrypt";
import config from "../../config/config.js";
import { OAuth2Client } from "google-auth-library";
import { apiResponse } from "../../helper/apiResponse.js";
import enums from "../../config/enum.js";
import moment from "moment";
import helper from "../../helper/common.js";
import { StatusCodes } from "http-status-codes";
import userService from "../user/service.js";
import emailService from "../email/service.js";

const verifyToken = async (req, res) => {
  try {
    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      message: "Token is verify successfully.",
      status: true,
    });
  } catch (error) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
      status: false,
    });
  }
};

const registerByEmail = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // find user by email
    const user = await userService.findOne({
      email: email,
    });

    if (user) {
      return apiResponse({
        res,
        status: false,
        message: "Email id already in use",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }
    // Hash password
    const hashPassword = await bcrypt.hash(password, 10);

    // generate otp
    const { otp, otpExpiresAt } = helper.generateOTP();

    // send otp to email
    await emailService.sendOTPEmail({
      email,
      otp,
      otpExpiresAt,
    });

    // Create user
    const doc = {
      email,
      password: hashPassword,
      provider: enums.authProviderEnum.EMAIL,
      otp: otp,
      name: name,
      otpExpiresAt: otpExpiresAt,
    };

    await userService.create(doc);

    return apiResponse({
      res,
      statusCode: StatusCodes.CREATED,
      status: true,
      message: "Registration complete! Check your email for verification OTP",
    });
  } catch (error) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const registerByMobile = async (req, res) => {
  try {
    const { mobileNumber, password } = req.body;

    // find user by mobile number
    const user = await userService.findOne({
      mobileNumber: mobileNumber,
    });

    if (user) {
      return apiResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        status: false,
        message: "Mobile number already in use",
      });
    }

    // generate otp
    const { otp, otpExpiresAt } = helper.generateOTP();

    // Hash password
    const hashPassword = await bcrypt.hash(password, 10);

    // Create user
    const doc = {
      mobileNumber,
      password: hashPassword,
      provider: enums.authProviderEnum.MOBILE,
      otp: otp,
      otpExpiresAt: otpExpiresAt,
    };

    await userService.create(doc);

    return apiResponse({
      res,
      statusCode: StatusCodes.CREATED,
      status: true,
      message: "Registration complete! Check your message for verification OTP",
      data: { otp },
    });
  } catch (error) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const loginByEmail = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userService.findOne({ email });

    //  check user exist with email
    if (!user) {
      return apiResponse({
        res,
        statusCode: StatusCodes.UNAUTHORIZED,
        status: false,
        message: "Invalid credentials",
      });
    }

    // check user is verified or not
    if (!user.isVerified) {
      return apiResponse({
        res,
        status: false,
        statusCode: StatusCodes.FORBIDDEN,
        message: "Please verify your account",
      });
    }

    // compare user password
    const userPassword = user?.password || "";
    const isMatch = await bcrypt.compare(password, userPassword);

    // check for user password is match or not
    if (!isMatch) {
      return apiResponse({
        res,
        status: false,
        statusCode: StatusCodes.UNAUTHORIZED,
        message: "Invalid credentials",
      });
    }

    // generate new token
    const token = await helper.generateToken({ userId: user._id });

    const response = {
      token,
      user: {
        _id: user._id,
        role: user.role,
        email: user.email,
        mobileNumber: user.mobileNumber,
        name: user.name,
      },
    };

    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      status: true,
      message: "Login successful",
      data: response,
    });
  } catch (error) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const loginByMobile = async (req, res) => {
  try {
    const { mobileNumber, password } = req.body;
    const user = await userService.findOne({ mobileNumber });

    //  check user exist with email
    if (!user) {
      return apiResponse({
        res,
        statusCode: StatusCodes.UNAUTHORIZED,
        status: false,
        message: "Invalid credentials",
      });
    }

    // check user is verified or not
    if (!user.isVerified) {
      return apiResponse({
        res,
        statusCode: StatusCodes.FORBIDDEN,
        status: false,
        message: "Please verify your account",
      });
    }

    // compare user password
    const userPassword = user.password;

    const isMatch = await bcrypt.compare(password, userPassword);

    // check for user password is match or not
    if (!isMatch) {
      return apiResponse({
        res,
        statusCode: StatusCodes.UNAUTHORIZED,
        status: false,
        message: "Invalid credentials",
      });
    }

    // generate new token
    const token = await helper.generateToken({ userId: user._id });

    const response = {
      token,
      user: {
        _id: user._id,
        role: user.role,
        email: user.email,
        mobileNumber: user.mobileNumber,
      },
    };

    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      status: true,
      message: "Login successful",
      data: response,
    });
  } catch (error) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const loginByGoogle = async (req, res) => {
  try {
    const { email, name } = req.body;

    new OAuth2Client({
      clientId: config.google.clientId,
      clientSecret: config.google.clientSecret,
    });

    if (!email) {
      return apiResponse({
        res,
        statusCode: StatusCodes.UNAUTHORIZED,
        status: false,
        message: "Invalid authentication",
      });
    }

    let user = await userService.findOne({
      email: email,
    });

    if (!user) {
      user = await userService.create({
        email: email,
        name: name,
        providerId: null,
        provider: enums.authProviderEnum.GOOGLE,
        isVerified: true,
      });
    } else {
      user.isVerified = true;
      user.providerId = null;
      user.provider = enums.authProviderEnum.GOOGLE;
      user.password = null;
      user.otp = null;
      user.otpExpiresAt = null;
      // Save changes
      user = await user.save();
    }

    const generatedToken = await helper.generateToken({ userId: user._id });

    const result = {
      token: generatedToken,
      user: {
        _id: user._id,
        role: user.role,
        email: user.email,
        mobileNumber: user.mobileNumber,
        name: user.name,
      },
    };

    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      status: true,
      data: result,
      message: "User logged in successfully",
    });
  } catch (error) {
    return apiResponse({
      error,
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const forgotPasswordEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userService.findOne({ email: email });

    if (!user) {
      return apiResponse({
        res,
        error: {
          email: `User does not exist with email ${email}`,
        },
        statusCode: StatusCodes.BAD_REQUEST,
        status: false,
      });
    }

    const { otp, otpExpiresAt } = helper.generateOTP();

    // save otp and otp expiresAt to database
    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    // send otp to email
    await emailService.sendOTPEmail({
      email,
      otp,
      otpExpiresAt,
    });

    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      status: true,
      message: "OTP send to your email address please check",
    });
  } catch (error) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const forgotPasswordMobile = async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    const user = await userService.findOne({ mobileNumber: mobileNumber });

    if (!user) {
      return apiResponse({
        res,
        error: {
          email: `User does not exist`,
        },
        statusCode: StatusCodes.BAD_REQUEST,
        status: false,
      });
    }

    const { otp, otpExpiresAt } = helper.generateOTP();

    // save otp and otp expiresAt to database
    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    // TODO: send otp to mobile number

    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      status: true,
      message: "OTP send to your mobile number please check",
      data: { otp },
    });
  } catch (error) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await userService.findOne({
      email,
    });

    // check if the user exist
    if (!user) {
      return apiResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        error: {
          email: "User not found",
        },
        status: false,
      });
    }

    // check otp is valid
    if (otp !== user.otp) {
      return apiResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: "Invalid OTP",
        status: false,
      });
    }

    if (!user.otpExpiresAt || moment().isSameOrAfter(user.otpExpiresAt)) {
      return apiResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: "OTP has expired",
        status: false,
      });
    }

    const token = await helper.generateToken({ userId: user._id });

    user.isVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;

    await user.save();

    return apiResponse({
      res,
      status: true,
      data: { token },
      message: "OTP verified successfully",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const verifyMobileOTP = async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body;

    const user = await userService.findOne({
      mobileNumber,
    });

    // check if the user exist
    if (!user) {
      return apiResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        error: {
          email: "User not found",
        },
        status: false,
      });
    }

    // check otp is valid
    if (otp !== user.otp) {
      return apiResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        error: {
          email: "Invalid OTP",
        },
        status: false,
      });
    }

    if (!user.otpExpiresAt || moment().isSameOrAfter(user.otpExpiresAt)) {
      return apiResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: "OTP has expired",
        status: false,
      });
    }

    const token = await helper.generateToken({ userId: user._id });

    user.isVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;

    await user.save();

    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      status: true,
      data: { token },
      message: "OTP verified successfully",
    });
  } catch (error) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const resendEmailOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await userService.findOne({
      email,
    });

    if (!user) {
      return apiResponse({
        res,
        statusCode: StatusCodes.NOT_FOUND,
        message: "User not found",
        status: false,
      });
    }

    const { otp, otpExpiresAt } = helper.generateOTP();

    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    if (email) {
      await emailService.sendOTPEmail({
        email: user.email,
        otp,
        otpExpiresAt,
      });
      return apiResponse({
        res,
        statusCode: StatusCodes.OK,
        status: true,
        message: "OTP sent successfully",
      });
    }

    if (mobileNumber) {
      return apiResponse({
        res,
        statusCode: StatusCodes.OK,
        status: true,
        message: "OTP sent successfully",
        data: { otp: otp },
      });
    }
  } catch (error) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const resendMobileOTP = async (req, res) => {
  try {
    const { mobileNumber } = req.body;

    const user = await userService.findOne({
      mobileNumber,
    });

    if (!user) {
      return apiResponse({
        res,
        statusCode: StatusCodes.NOT_FOUND,
        message: "User not found",
        status: false,
      });
    }

    const { otp, otpExpiresAt } = helper.generateOTP();

    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      status: true,
      message: "OTP sent successfully",
      data: { otp: otp },
    });
  } catch (error) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = req.user;

    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return apiResponse({
        res,
        message: "Old password is incorrect",
        statusCode: StatusCodes.BAD_REQUEST,
        status: false,
      });
    }

    const hashPassword = await bcrypt.hash(newPassword, 10);

    await userService.findByIdAndUpdate(user._id, {
      password: hashPassword,
    });

    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      message: "Password changed successfully",
      status: true,
    });
  } catch (error) {
    console.error(error);
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await userService.findOne({ email });

    if (!user) {
      return apiResponse({
        res,
        statusCode: StatusCodes.NOT_FOUND,
        status: false,
        message: "User not found",
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    await userService.findByIdAndUpdate(user._id, {
      password: hashPassword,
    });

    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      message: "Password reset successfully",
      status: true,
    });
  } catch (error) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

export default {
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
  verifyToken,
};
