import config from "../config/config.js";
import jwt from "jsonwebtoken";
import moment from "moment";
import enums from "../config/enum.js";
import WebSocket from "ws";

const paginationDetails = ({ page = 1, totalItems, limit }) => {
  const totalPages = Math.ceil(totalItems / limit);

  return { page: Number(page), totalPages, totalItems, limit };
};

const paginationFun = (data) => {
  const { page = 1, limit = 10 } = data;

  return {
    limit: Number(limit),
    skip: (Number(page) - 1) * Number(limit),
  };
};

const generateToken = async (payload, expiresIn = "7d") => {
  return jwt.sign(payload, config.jwt.secretKey, {
    expiresIn: expiresIn,
  });
};

const verifyToken = async (token) => {
  return jwt.verify(token, config.jwt.secretKey);
};

const generateOTP = () => {
  // Generate a random number between 1000 and 9999
  const otp = Math.floor(1000 + Math.random() * 9000);

  const otpExpiresAt = moment()
    .add(config.otpExpiryDurationSeconds, "seconds")
    .toDate();
  return { otp, otpExpiresAt };
};

const extractFileKey = (url) => {
  const parts = url.split("/");
  const fileKey = parts.slice(3).join("/");
  return fileKey;
};

const calculatePrice = ({
  unitPrice,
  taxes,
  isTaxIncluded,
  discount,
  discountType,
}) => {
  let basePrice = 0;
  let finalPrice = 0;
  const tax = taxes.reduce((total, tax) => total + tax.value, 0);

  // Calculate base price
  if (isTaxIncluded) {
    basePrice = unitPrice / (1 + tax / 100);
  } else {
    basePrice = unitPrice;
  }

  // Apply discount
  if (discountType === enums.discountTypeEnum.PERCENTAGE) {
    finalPrice = basePrice * (1 - discount / 100);
  } else {
    finalPrice = basePrice - discount;
  }

  // Apply tax to final price
  finalPrice *= 1 + tax / 100;

  return {
    basePrice: Number(basePrice.toFixed(2)),
    finalPrice: Number(finalPrice.toFixed(2)),
  };
};

const webSocketServer = (server) => {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
      console.log('received: %s', message);
    });

    ws.send('something');
  });

  return wss;
};

export default {
  generateOTP,
  verifyToken,
  generateToken,
  paginationDetails,
  paginationFun,
  calculatePrice,
  extractFileKey,
  webSocketServer,
};
