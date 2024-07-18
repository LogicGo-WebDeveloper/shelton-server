import mongoose from "mongoose";
import enums from "../../config/enum.js";

const schema = new mongoose.Schema(
  {
    email: {
      type: String,
      lowercase: true,
      default: null,
    },
    name: {
      type: String,
      lowercase: true,
      default: null,
    },
    mobileNumber: {
      type: String,
      default: null,
    },
    password: {
      type: String,
      default: null,
    },
    providerId: {
      type: String,
      default: null,
    },
    provider: {
      type: String,
      enum: Object.values(enums.authProviderEnum),
      required: true,
    },
    otp: {
      type: Number,
      default: null,
    },
    otpExpiresAt: {
      type: Date,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: Object.values(enums.userRoleEnum),
      default: enums.userRoleEnum.USER,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const UserModel = mongoose.model("User", schema);
export default UserModel;
