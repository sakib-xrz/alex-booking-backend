import { User } from '@prisma/client';
import bcrypt from 'bcrypt';
import config from '../../config';
import httpStatus from 'http-status';
import { JwtPayload } from 'jsonwebtoken';
import AppError from '../../errors/AppError';
import prisma from '../../utils/prisma';
import AuthUtils from './auth.utils';

const Register = async (payload: User) => {
  const { email, password, name } = payload;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError(httpStatus.CONFLICT, 'User already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(
    password,
    Number(config.bcrypt_salt_rounds),
  );

  // Create user
  const result = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
    },
  });

  // Prepare JWT payload
  const jwtPayload = {
    id: result.id,
    email: result.email,
    role: result.role,
  };

  const access_token = AuthUtils.CreateToken(
    jwtPayload,
    config.jwt_access_token_secret as string,
    config.jwt_access_token_expires_in as string,
  );

  return { access_token };
};

const Login = async (payload: User) => {
  const user = await prisma.user.findFirst({
    where: { email: payload.email },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'No user found with this email');
  }

  const isPasswordMatched = await bcrypt.compare(
    payload.password,
    user.password,
  );

  if (!isPasswordMatched) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid email or password');
  }

  const jwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const access_token = AuthUtils.CreateToken(
    jwtPayload,
    config.jwt_access_token_secret as string,
    config.jwt_access_token_expires_in as string,
  );

  return { access_token };
};

const ChangePassword = async (
  payload: {
    old_password: string;
    new_password: string;
  },
  user: JwtPayload,
) => {
  const isUserValid = await prisma.user.findFirst({
    where: { id: user.id },
  });

  if (!isUserValid) {
    throw new AppError(httpStatus.NOT_FOUND, 'No user found');
  }

  const isPasswordMatched = await bcrypt.compare(
    payload.old_password,
    isUserValid.password,
  );

  if (!isPasswordMatched) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid password');
  }

  const hashedPassword = await bcrypt.hash(
    payload.new_password,
    Number(config.bcrypt_salt_rounds),
  );

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });
};

const GetMyProfile = async (user: JwtPayload) => {
  const userProfile = await prisma.user.findUnique({
    where: { id: user.id, email: user.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      profile_picture: true,
      specialization: true,
      created_at: true,
    },
  });

  if (!userProfile) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  return userProfile;
};

const AuthService = {
  Register,
  Login,
  ChangePassword,
  GetMyProfile,
};

export default AuthService;
