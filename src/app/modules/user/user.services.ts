import prisma from '../../utils/prisma';
import path from 'path';
import {
  deleteFromSpaces,
  extractKeyFromUrl,
  uploadToSpaces,
} from '../../utils/handelFile';
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { Prisma, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import config from '../../config';
import UserUtils from './user.utils';
import sendMail from '../../utils/mailer';
import calculatePagination, {
  IPaginationOptions,
} from '../../utils/pagination';
import { counselorSearchableFields } from './user.constant';

interface ICounselorFilters {
  search?: string;
}

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
      specialization: true,
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
      specialization: true,
      profile_picture: true,
      role: true,
      created_at: true,
      updated_at: true,
    },
  });

  return result;
};

const CreateCounselor = async (payload: {
  name: string;
  email: string;
  specialization?: string;
}) => {
  const { name, email, specialization } = payload;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError(
      httpStatus.CONFLICT,
      'User with this email already exists',
    );
  }

  // Generate random password
  const randomPassword = UserUtils.generateRandomPassword();

  // Hash the password
  const hashedPassword = await bcrypt.hash(
    randomPassword,
    Number(config.bcrypt_salt_rounds),
  );

  // Create counselor
  const newCounselor = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: Role.COUNSELOR,
      specialization: specialization || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      specialization: true,
      role: true,
      created_at: true,
      updated_at: true,
    },
  });

  // Send email with credentials in background (non-blocking)
  Promise.resolve().then(async () => {
    try {
      const emailTemplate = UserUtils.createCounselorEmailTemplate(
        name,
        email,
        randomPassword,
      );

      await sendMail(
        email,
        'Welcome to Alexander Rodriguez Counseling - Your Account Credentials',
        emailTemplate,
      );

      console.log(`Welcome email sent successfully to ${email}`);
    } catch (error) {
      console.error(`Failed to send welcome email to ${email}:`, error);
    }
  });

  return newCounselor;
};

const GetCounselors = async (
  filters: ICounselorFilters,
  paginationOptions: IPaginationOptions,
) => {
  const { page, limit, skip, sort_by, sort_order } =
    calculatePagination(paginationOptions);
  const { search } = filters;

  const whereConditions: Prisma.UserWhereInput = {
    role: Role.COUNSELOR,
    is_deleted: false,
  };

  if (search) {
    whereConditions.OR = counselorSearchableFields.map((field) => ({
      [field]: {
        contains: search,
        mode: 'insensitive' as Prisma.QueryMode,
      },
    }));
  }

  const orderBy: Prisma.UserOrderByWithRelationInput = {};

  if (sort_by === 'name') {
    orderBy.name = sort_order as Prisma.SortOrder;
  } else if (sort_by === 'email') {
    orderBy.email = sort_order as Prisma.SortOrder;
  } else {
    orderBy.created_at = sort_order as Prisma.SortOrder;
  }

  const total = await prisma.user.count({
    where: whereConditions,
  });

  const counselors = await prisma.user.findMany({
    where: whereConditions,
    select: {
      id: true,
      name: true,
      email: true,
      specialization: true,
      role: true,
      created_at: true,
      updated_at: true,
    },
    orderBy,
    skip,
    take: limit,
  });

  return {
    data: counselors,
    meta: {
      total,
      page,
      limit,
    },
  };
};

export const UserService = {
  UpdateProfilePicture,
  UpdateUserProfile,
  CreateCounselor,
  GetCounselors,
};
