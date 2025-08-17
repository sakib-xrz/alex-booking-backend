"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var handelFile_exports = {};
__export(handelFile_exports, {
  deleteFromSpaces: () => deleteFromSpaces,
  deleteMultipleFromSpaces: () => deleteMultipleFromSpaces,
  extractKeyFromUrl: () => extractKeyFromUrl,
  generateSignedUrl: () => generateSignedUrl,
  spacesClient: () => spacesClient,
  upload: () => upload,
  uploadToSpaces: () => uploadToSpaces
});
module.exports = __toCommonJS(handelFile_exports);
var import_multer = __toESM(require("multer"));
var import_path = __toESM(require("path"));
var import_client_s3 = require("@aws-sdk/client-s3");
var import_s3_request_presigner = require("@aws-sdk/s3-request-presigner");
var import_config = __toESM(require("../config/index"));
var import_uuid = require("uuid");
const spacesClient = new import_client_s3.S3Client({
  forcePathStyle: false,
  endpoint: import_config.default.digitalocean.spaces_endpoint,
  region: import_config.default.digitalocean.spaces_region,
  credentials: {
    accessKeyId: import_config.default.digitalocean.spaces_access_key,
    secretAccessKey: import_config.default.digitalocean.spaces_secret_key
  }
});
const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
const storage = import_multer.default.memoryStorage();
const fileFilter = (_req, file, cb) => {
  const extname = allowedTypes.test(
    import_path.default.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only images (jpeg, jpg, png, gif), PDFs, and DOC/DOCX files are allowed"
      )
    );
  }
};
const upload = (0, import_multer.default)({
  storage,
  fileFilter,
  limits: { fileSize: 30 * 1024 * 1024 }
});
const uploadToSpaces = async (file, options = {}) => {
  try {
    const fileExtension = import_path.default.extname(file.originalname);
    const fileName = options.filename || `${(0, import_uuid.v4)()}${fileExtension}`;
    const folder = options.folder || "uploads";
    const key = `${folder}/${fileName}`;
    const uploadParams = {
      Bucket: import_config.default.digitalocean.spaces_bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: "public-read"
    };
    const command = new import_client_s3.PutObjectCommand(uploadParams);
    await spacesClient.send(command);
    const publicUrl = `${import_config.default.digitalocean.spaces_endpoint}/${import_config.default.digitalocean.spaces_bucket}/${key}`;
    return {
      url: publicUrl,
      key
    };
  } catch (error) {
    console.error("Error uploading to DigitalOcean Spaces:", error);
    throw new Error(`DigitalOcean Spaces upload failed: ${error}`);
  }
};
const deleteFromSpaces = async (key) => {
  try {
    const deleteParams = {
      Bucket: import_config.default.digitalocean.spaces_bucket,
      Key: key
    };
    const command = new import_client_s3.DeleteObjectCommand(deleteParams);
    await spacesClient.send(command);
  } catch (error) {
    console.error("Error deleting from DigitalOcean Spaces:", error);
    throw new Error(`Failed to delete from DigitalOcean Spaces: ${error}`);
  }
};
const deleteMultipleFromSpaces = async (keys) => {
  try {
    if (keys.length === 0) return;
    const deleteParams = {
      Bucket: import_config.default.digitalocean.spaces_bucket,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
        Quiet: true
      }
    };
    const command = new import_client_s3.DeleteObjectsCommand(deleteParams);
    await spacesClient.send(command);
  } catch (error) {
    console.error(
      "Error deleting multiple files from DigitalOcean Spaces:",
      error
    );
    throw new Error(
      `Failed to delete multiple files from DigitalOcean Spaces: ${error}`
    );
  }
};
const extractKeyFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const bucketName = import_config.default.digitalocean.spaces_bucket;
    if (urlObj.hostname.startsWith(bucketName)) {
      return urlObj.pathname.slice(1);
    } else {
      const pathParts = urlObj.pathname.split("/");
      if (pathParts[1] === bucketName) {
        return pathParts.slice(2).join("/");
      }
    }
    return null;
  } catch (error) {
    console.error("Error extracting key from URL:", error);
    return null;
  }
};
const generateSignedUrl = async (key, expiresIn = 3600) => {
  try {
    const command = new import_client_s3.PutObjectCommand({
      Bucket: import_config.default.digitalocean.spaces_bucket,
      Key: key
    });
    const signedUrl = await (0, import_s3_request_presigner.getSignedUrl)(spacesClient, command, {
      expiresIn
    });
    return signedUrl;
  } catch (error) {
    console.error("Error generating signed URL:", error);
    throw new Error(`Failed to generate signed URL: ${error}`);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  deleteFromSpaces,
  deleteMultipleFromSpaces,
  extractKeyFromUrl,
  generateSignedUrl,
  spacesClient,
  upload,
  uploadToSpaces
});
