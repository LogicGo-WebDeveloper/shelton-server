import config from "../config/config.js";
import jwt from "jsonwebtoken";
import moment from "moment";
import enums from "../config/enum.js";
import WebSocket from "ws";
import RecentMatch from "../features/sport/models/recentMatchesSchema.js";
import { createCanvas, loadImage } from "canvas";
import {
  S3Client,
  PutObjectCommand,
  ListBucketsCommand,
} from "@aws-sdk/client-s3";
import { s3Client } from "../config/aws.config.js";
import axiosInstance from "../config/axios.config.js";

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

  wss.on("connection", function connection(ws) {
    ws.on("message", function incoming(message) {
      console.log("received: %s", message);
    });

    ws.send("something");
  });

  return wss;
};

const storeRecentMatch = async (userId, sport, matchData) => {
  try {
    // Find the user entry
    let userEntry = await RecentMatch.findOne({ userId });
    if (!userEntry) {
      userEntry = new RecentMatch({
        userId,
        data: [{ sport, data: [matchData] }],
      });
    } else {
      // If user entry exists, find the sport entry
      const sportEntry = userEntry.data.find((entry) => entry.sport === sport);

      if (sportEntry) {
        // Check for duplicate matchId
        const isDuplicate = sportEntry.data.some(
          (match) => match.id === matchData.id
        );

        if (!isDuplicate) {
          // If not a duplicate, push the new match data
          sportEntry.data.push(matchData);
          // Ensure the sport data array does not exceed 10 entries
          if (sportEntry.data.length > 10) {
            sportEntry.data.shift();
          }
        }
      } else {
        // If sport entry does not exist, create a new one
        userEntry.data.push({
          sport,
          data: [matchData],
        });
      }
    }

    // Save the user entry
    await userEntry.save();
  } catch (error) {
    console.error("Error storing recent match:", error);
  }
};

const getTopPlayersImage = async (playerId) => {
  const { data } = await axiosInstance.get(`/api/v1/player/${playerId}/image`);

  return data ?? [];
};

const getTeamImages = async (teamId) => {
  const { data } = await axiosInstance.get(`/api/v1/team/${teamId}/image`);

  return data ?? [];
};

const getTournamentImage = async (id) => {
  const { data } = await axiosInstance.get(
    `/api/v1/unique-tournament/${id}/image`
  );

  return data ?? [];
};

async function checkBucketExists(bucketName) {
  try {
    const data = await s3Client.send(new ListBucketsCommand({}));
    const bucketExists = data.Buckets.some(
      (bucket) => bucket.Name === bucketName
    );
    if (!bucketExists) {
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
}

// Function to convert image from URL to PNG or JPEG and upload to S3
async function uploadImageInS3Bucket(url, folderName, id) {
  const format = "png";
  const bucketName = "guardianshot";
  const key = `${process.env.DIGITAL_OCEAN_DIRNAME}/${folderName}/${id}`;
  try {
    const bucketExists = await checkBucketExists(bucketName);
    if (!bucketExists) return;
    // Load image from URL

    const img = await loadImage(url);

    // Create a canvas element
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext("2d");

    // Draw image onto canvas
    ctx.drawImage(img, 0, 0);

    // Convert canvas to PNG or JPEG
    let buffer;
    if (format === "png") {
      buffer = canvas.toBuffer("image/png");
    } else if (format === "jpeg" || format === "jpg") {
      buffer = canvas.toBuffer("image/jpeg");
    } else {
      console.error("Unsupported format:", format);
      return;
    }

    // Upload to S3 with public read access
    const params = {
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: format === "png" ? "image/png" : "image/jpeg",
      ACL: "public-read",
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);
  } catch (err) {
    if (err.Code === "NoSuchBucket") {
      console.error(
        `Bucket "${bucketName}" does not exist. Please create the bucket or check the bucket name.`
      );
    } else {
      console.error("Error:", err);
    }
  }
}

export default {
  generateOTP,
  verifyToken,
  generateToken,
  paginationDetails,
  paginationFun,
  calculatePrice,
  extractFileKey,
  webSocketServer,
  storeRecentMatch,
  getTopPlayersImage,
  getTeamImages,
  getTournamentImage,
  uploadImageInS3Bucket,
};
