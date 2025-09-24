"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.spacesClient = exports.convertHeicToJpeg = exports.generateSignedUrl = exports.extractKeyFromUrl = exports.deleteMultipleFromSpaces = exports.deleteFromSpaces = exports.uploadToSpaces = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const index_1 = __importDefault(require("../config/index"));
const uuid_1 = require("uuid");
const spacesClient = new client_s3_1.S3Client({
    forcePathStyle: false,
    endpoint: index_1.default.digitalocean.spaces_endpoint,
    region: index_1.default.digitalocean.spaces_region,
    credentials: {
        accessKeyId: index_1.default.digitalocean.spaces_access_key,
        secretAccessKey: index_1.default.digitalocean.spaces_secret_key,
    },
});
exports.spacesClient = spacesClient;
const allowedTypes = /jpeg|jpg|png|gif|webp|heic|heif|pdf|doc|docx/;
const storage = multer_1.default.memoryStorage();
const fileFilter = (_req, file, cb) => {
    const fileExtension = path_1.default.extname(file.originalname).toLowerCase();
    const extname = allowedTypes.test(fileExtension);
    const heicMimeTypes = [
        'image/heic',
        'image/heif',
        'image/heic-sequence',
        'image/heif-sequence',
    ];
    const isHeicFile = heicMimeTypes.includes(file.mimetype.toLowerCase());
    const isHeicExtensionWithGenericMime = (fileExtension === '.heic' || fileExtension === '.heif') &&
        file.mimetype === 'application/octet-stream';
    const mimetype = allowedTypes.test(file.mimetype) ||
        isHeicFile ||
        isHeicExtensionWithGenericMime;
    if (extname && mimetype) {
        cb(null, true);
    }
    else {
        cb(new Error('Only images (jpeg, jpg, png, gif, webp, heic, heif), PDFs, and DOC/DOCX files are allowed'));
    }
};
const upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 30 * 1024 * 1024 },
});
exports.upload = upload;
const convertHeicToJpeg = (buffer) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const convert = yield Promise.resolve().then(() => __importStar(require('heic-convert')));
        const convertedBuffer = yield convert.default({
            buffer: buffer,
            format: 'JPEG',
            quality: 0.9,
        });
        const finalBuffer = Buffer.isBuffer(convertedBuffer)
            ? convertedBuffer
            : Buffer.from(convertedBuffer);
        return {
            buffer: finalBuffer,
            mimetype: 'image/jpeg',
        };
    }
    catch (error) {
        console.error('Error converting HEIC to JPEG:', error);
        throw new Error(`HEIC conversion failed: ${error}`);
    }
});
exports.convertHeicToJpeg = convertHeicToJpeg;
const uploadToSpaces = (file_1, ...args_1) => __awaiter(void 0, [file_1, ...args_1], void 0, function* (file, options = {}) {
    try {
        let fileBuffer = file.buffer;
        let contentType = file.mimetype;
        let fileExtension = path_1.default.extname(file.originalname);
        const isHeicFile = fileExtension.toLowerCase() === '.heic' ||
            fileExtension.toLowerCase() === '.heif' ||
            (file.mimetype === 'application/octet-stream' &&
                (fileExtension.toLowerCase() === '.heic' ||
                    fileExtension.toLowerCase() === '.heif'));
        if (isHeicFile) {
            console.log('Converting HEIC file to JPEG...');
            const converted = yield convertHeicToJpeg(fileBuffer);
            fileBuffer = converted.buffer;
            contentType = converted.mimetype;
            fileExtension = '.jpg';
        }
        const fileName = options.filename || `${(0, uuid_1.v4)()}${fileExtension}`;
        const folder = options.folder || 'uploads';
        const key = `${folder}/${fileName}`;
        const uploadParams = {
            Bucket: index_1.default.digitalocean.spaces_bucket,
            Key: key,
            Body: fileBuffer,
            ContentType: contentType,
            ACL: 'public-read',
        };
        const command = new client_s3_1.PutObjectCommand(uploadParams);
        yield spacesClient.send(command);
        const publicUrl = `${index_1.default.digitalocean.spaces_endpoint}/${index_1.default.digitalocean.spaces_bucket}/${key}`;
        return {
            url: publicUrl,
            key: key,
        };
    }
    catch (error) {
        console.error('Error uploading to DigitalOcean Spaces:', error);
        throw new Error(`DigitalOcean Spaces upload failed: ${error}`);
    }
});
exports.uploadToSpaces = uploadToSpaces;
const deleteFromSpaces = (key) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deleteParams = {
            Bucket: index_1.default.digitalocean.spaces_bucket,
            Key: key,
        };
        const command = new client_s3_1.DeleteObjectCommand(deleteParams);
        yield spacesClient.send(command);
    }
    catch (error) {
        console.error('Error deleting from DigitalOcean Spaces:', error);
        throw new Error(`Failed to delete from DigitalOcean Spaces: ${error}`);
    }
});
exports.deleteFromSpaces = deleteFromSpaces;
const deleteMultipleFromSpaces = (keys) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (keys.length === 0)
            return;
        const deleteParams = {
            Bucket: index_1.default.digitalocean.spaces_bucket,
            Delete: {
                Objects: keys.map((key) => ({ Key: key })),
                Quiet: true,
            },
        };
        const command = new client_s3_1.DeleteObjectsCommand(deleteParams);
        yield spacesClient.send(command);
    }
    catch (error) {
        console.error('Error deleting multiple files from DigitalOcean Spaces:', error);
        throw new Error(`Failed to delete multiple files from DigitalOcean Spaces: ${error}`);
    }
});
exports.deleteMultipleFromSpaces = deleteMultipleFromSpaces;
const extractKeyFromUrl = (url) => {
    try {
        const urlObj = new URL(url);
        const bucketName = index_1.default.digitalocean.spaces_bucket;
        if (urlObj.hostname.startsWith(bucketName)) {
            return urlObj.pathname.slice(1);
        }
        else {
            const pathParts = urlObj.pathname.split('/');
            if (pathParts[1] === bucketName) {
                return pathParts.slice(2).join('/');
            }
        }
        return null;
    }
    catch (error) {
        console.error('Error extracting key from URL:', error);
        return null;
    }
};
exports.extractKeyFromUrl = extractKeyFromUrl;
const generateSignedUrl = (key_1, ...args_1) => __awaiter(void 0, [key_1, ...args_1], void 0, function* (key, expiresIn = 3600) {
    try {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: index_1.default.digitalocean.spaces_bucket,
            Key: key,
        });
        const signedUrl = yield (0, s3_request_presigner_1.getSignedUrl)(spacesClient, command, {
            expiresIn,
        });
        return signedUrl;
    }
    catch (error) {
        console.error('Error generating signed URL:', error);
        throw new Error(`Failed to generate signed URL: ${error}`);
    }
});
exports.generateSignedUrl = generateSignedUrl;
