import { apiResponse, parseJoiError } from "../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";

const validate = (schema) => (req, res, next) => {
  if (!schema) {
    return apiResponse({
      res,
      status: false,
      message: "Validation schema not found",
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }

  const keys = Object.keys(schema);

  const isValidationErrors = [];

  let errors = {};

  keys.forEach((key) => {
    const { error, value } = schema[key].validate(req[key], {
      abortEarly: false,
    });

    if (error) {
      isValidationErrors.push(true);

      const parsedError = parseJoiError(error);

      errors = { ...errors, ...parsedError };
    } else {
      req[key] = value;
    }
  });

  if (Object.keys(errors).length > 0) {
    return apiResponse({
      res,
      status: false,
      message: errors,
      statusCode: StatusCodes.BAD_REQUEST,
      body: null,
    });
  }

  next();
};

export default validate;
