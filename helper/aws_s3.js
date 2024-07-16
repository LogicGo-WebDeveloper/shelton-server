import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../config/aws.config.js";
import config from "../config/config.js";

/**upload file using digital ocean */
export const uploadFile = async ({ filename, file, ACL }) => {
  try {
    const bucketParams = {
      Bucket: config.cloud.digitalocean.bucketName,
      Key: filename,
      Body: file,
      ACL: ACL || "public-read",
    };

    const data = await s3Client.send(new PutObjectCommand(bucketParams));
    return data;
  } catch (error) {
    console.log("Error", error);
    throw error;
  }
};

/**update file */
export const updateFile = async ({ oldFilename, filename, file, ACL }) => {
  try {
    if (oldFilename) {
      await deleteFile({
        filename: oldFilename,
      });
    }
    return await uploadFile({
      filename,
      file,
      ACL,
    });
  } catch (error) {
    console.log("Error", error);
    throw error;
  }
};

/**delete file */
export const deleteFile = async ({ filename }) => {
  try {
    const deleteBucket = {
      Bucket: config.cloud.digitalocean.bucketName,
      Key: filename,
    };

    await s3Client.send(new DeleteObjectCommand(deleteBucket));
    console.log("File is deleted.");
  } catch (error) {
    console.log("Error", error);
    throw error;
  }
};
