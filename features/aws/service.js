import { v4 as uuidv4 } from "uuid";
import config from "../../config/config.js";
import { deleteFile, uploadFile } from "../../helper/aws_s3.js";

export const uploadSingleFile = async (req, folderName) => {
  let filename;
  if (req.file) {
    const { buffer: imageBuffer, originalname } = req.file;
    const fileExt = originalname.split(".").pop();
    const name = `${uuidv4()}.${fileExt}`;
    await uploadFile({
      filename: `${config.cloud.digitalocean.rootDirname}/${folderName}/${name}`,
      file: imageBuffer,
      ACL: "public-read",
    });
    filename = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/${folderName}/${name}`;
  }

  return filename;
};

export const updateFile = async (req, findDoc, folderName) => {
  let url, newFilename;
  if (req.file) {
    const { buffer: imageBuffer } = req.file;
    const originalName = req.file.originalname;
    const fileExt = originalName.split(".").pop();
    newFilename = `${uuidv4()}.${fileExt}`;
    if (findDoc && findDoc.url) {
      await deleteFile({
        filename: findDoc.url,
      });
    }
    await uploadFile({
      filename: `${config.cloud.digitalocean.rootDirname}/${folderName}/${newFilename}`,
      file: imageBuffer,
      ACL: "public-read",
    });
    url = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/${folderName}/${newFilename}`;
  }
  return url;
};

export const uploadMultipleFiles = async (req, folderName) => {
  const files = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const originalName = file.originalname;
      const fileExt = originalName.split(".").pop();
      const newFilename = `${uuidv4()}.${fileExt}`;

      await uploadFile({
        filename: `${config.cloud.digitalocean.rootDirname}/${folderName}/${newFilename}`,
        file: file.buffer,
        ACL: "public-read",
      });

      const fileUrl = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/${folderName}/${newFilename}`;
      files.push({ url: fileUrl });
    }
  }
  return files;
};

export const updateMultipleFiles = async (req, findDoc, folderName) => {
  let files = [];
  if (findDoc) {
    files = findDoc.files || [];
  }
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const originalName = file.originalname;
      const fileExt = originalName.split(".").pop();
      const name = `${uuidv4()}.${fileExt}`;

      await uploadFile({
        filename: `${config.cloud.digitalocean.rootDirname}/${folderName}/${name}`,
        file: file.buffer,
        ACL: "public-read",
      });

      let url = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/${folderName}/${name}`;
      files.push({ urls: url });
    }
  }
  return files;
};
