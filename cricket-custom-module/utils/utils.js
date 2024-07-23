import mongoose from "mongoose";

export const getHostUrl = (req, middlePath) => {
    return req.protocol + "://" + req.get("host") + "/images/" +`${middlePath}/`;
};

export const validateObjectIds = (ids) => {
  for (const [key, value] of Object.entries(ids)) {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return { isValid: false, message: `Invalid ${key}` };
    }
  }
  return { isValid: true };
};
  