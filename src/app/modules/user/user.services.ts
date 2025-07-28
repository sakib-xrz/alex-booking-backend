import prisma from '../../utils/prisma';
import path from 'path';
import {
  deleteFromSpaces,
  extractKeyFromUrl,
  uploadToSpaces,
} from '../../utils/handelFile';
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';

const UpdateProfilePicture = async (id: string, file: Express.Multer.File) => {
  const user = await prisma.user.findUnique({
    where: { id, is_deleted: false },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  let profilePicture: string | null = user.profile_picture || null;

  try {
    if (user.profile_picture) {
      const key = extractKeyFromUrl(user.profile_picture);
      if (key) {
        await deleteFromSpaces(key);
      }
    }

    const uploadResult = await uploadToSpaces(file, {
      folder: 'profile-pictures',
      filename: `profile_picture_${Date.now()}${path.extname(file.originalname)}`,
    });
    profilePicture = uploadResult?.url || null;
  } catch (error) {
    console.log(
      'Error from DigitalOcean Spaces while uploading profile picture',
      error,
    );
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Failed to upload profile picture',
    );
  }

  const result = await prisma.user.update({
    where: { id },
    data: { profile_picture: profilePicture },
    select: {
      id: true,
      name: true,
      email: true,
      profile_picture: true,
      role: true,
      created_at: true,
      updated_at: true,
    },
  });

  return result;
};

const UpdateUserProfile = async (id: string, data: { name?: string }) => {
  const user = await prisma.user.findUnique({
    where: { id, is_deleted: false },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const result = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      profile_picture: true,
      role: true,
      created_at: true,
      updated_at: true,
    },
  });

  return result;
};

export const UserService = {
  UpdateProfilePicture,
  UpdateUserProfile,
};
