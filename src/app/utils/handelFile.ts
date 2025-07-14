import multer from 'multer';
import path from 'path';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Request } from 'express';
import config from '../config/index';
import { v4 as uuidv4 } from 'uuid';

const spacesClient = new S3Client({
  forcePathStyle: false,
  endpoint: config.digitalocean.spaces_endpoint,
  region: config.digitalocean.spaces_region,
  credentials: {
    accessKeyId: config.digitalocean.spaces_access_key!,
    secretAccessKey: config.digitalocean.spaces_secret_key!,
  },
});

const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;

const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Only images (jpeg, jpg, png, gif), PDFs, and DOC/DOCX files are allowed',
      ),
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 30 * 1024 * 1024 },
});

const uploadToSpaces = async (
  file: Express.Multer.File,
  options: { folder?: string; filename?: string } = {},
): Promise<{ url: string; key: string }> => {
  try {
    const fileExtension = path.extname(file.originalname);
    const fileName = options.filename || `${uuidv4()}${fileExtension}`;
    const folder = options.folder || 'uploads';
    const key = `${folder}/${fileName}`;

    const uploadParams = {
      Bucket: config.digitalocean.spaces_bucket!,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read' as const,
    };

    const command = new PutObjectCommand(uploadParams);
    await spacesClient.send(command);

    const publicUrl = `${config.digitalocean.spaces_endpoint}/${config.digitalocean.spaces_bucket}/${key}`;

    return {
      url: publicUrl,
      key: key,
    };
  } catch (error) {
    console.error('Error uploading to DigitalOcean Spaces:', error);
    throw new Error(`DigitalOcean Spaces upload failed: ${error}`);
  }
};

const deleteFromSpaces = async (key: string): Promise<void> => {
  try {
    const deleteParams = {
      Bucket: config.digitalocean.spaces_bucket!,
      Key: key,
    };

    const command = new DeleteObjectCommand(deleteParams);
    await spacesClient.send(command);
  } catch (error) {
    console.error('Error deleting from DigitalOcean Spaces:', error);
    throw new Error(`Failed to delete from DigitalOcean Spaces: ${error}`);
  }
};

const deleteMultipleFromSpaces = async (keys: string[]): Promise<void> => {
  try {
    if (keys.length === 0) return;

    const deleteParams = {
      Bucket: config.digitalocean.spaces_bucket!,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
        Quiet: true,
      },
    };

    const command = new DeleteObjectsCommand(deleteParams);
    await spacesClient.send(command);
  } catch (error) {
    console.error(
      'Error deleting multiple files from DigitalOcean Spaces:',
      error,
    );
    throw new Error(
      `Failed to delete multiple files from DigitalOcean Spaces: ${error}`,
    );
  }
};

const extractKeyFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const bucketName = config.digitalocean.spaces_bucket!;

    if (urlObj.hostname.startsWith(bucketName)) {
      return urlObj.pathname.slice(1);
    } else {
      const pathParts = urlObj.pathname.split('/');
      if (pathParts[1] === bucketName) {
        return pathParts.slice(2).join('/');
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting key from URL:', error);
    return null;
  }
};

const generateSignedUrl = async (
  key: string,
  expiresIn: number = 3600,
): Promise<string> => {
  try {
    const command = new PutObjectCommand({
      Bucket: config.digitalocean.spaces_bucket!,
      Key: key,
    });

    const signedUrl = await getSignedUrl(spacesClient, command, {
      expiresIn,
    });

    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error(`Failed to generate signed URL: ${error}`);
  }
};

export {
  upload,
  uploadToSpaces,
  deleteFromSpaces,
  deleteMultipleFromSpaces,
  extractKeyFromUrl,
  generateSignedUrl,
  spacesClient,
};
