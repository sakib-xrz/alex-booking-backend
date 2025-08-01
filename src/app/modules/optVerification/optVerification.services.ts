import { addMinutes } from 'date-fns';
import prisma from '../../utils/prisma';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';

const CreateOpt = async ({ email }: { email: string }) => {
  let result;

  const isExistingEmail = await prisma.emailOTPVerification.findFirst({
    where: {
      email,
    },
  });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires_at = addMinutes(new Date(), 5);

  if (isExistingEmail && isExistingEmail.is_verified) {
    result = {
      email: isExistingEmail.email,
      isVerified: isExistingEmail.is_verified,
    };
  } else if (isExistingEmail && !isExistingEmail.is_verified) {
    const updatedOtp = await prisma.emailOTPVerification.update({
      where: {
        id: isExistingEmail.id,
      },
      data: {
        otp,
        expires_at,
      },
    });

    result = {
      email: updatedOtp.email,
      otp: updatedOtp.otp,
      expiresAt: updatedOtp.expires_at,
      isVerified: updatedOtp.is_verified,
    };
  } else {
    result = await prisma.emailOTPVerification.create({
      data: {
        email,
        otp,
        expires_at,
      },
    });
  }

  // TODO: NEED TO IMPLEMENT EMAIL SENDING FUNCTIONALITY @Sakib Vai

  return result;
};

const VerifyOpt = async ({ email, otp }: { email: string; otp: string }) => {
  const isVerifiedEmail = await prisma.emailOTPVerification.findFirst({
    where: {
      email,
      otp,
      expires_at: { gt: new Date() },
      is_verified: false,
    },
  });

  if (!isVerifiedEmail) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Email or OTP is incorrect');
  }

  const result = await prisma.emailOTPVerification.update({
    where: { id: isVerifiedEmail.id },
    data: { is_verified: true },
  });

  return result;
};

const OptVerificationService = { VerifyOpt, CreateOpt };

export default OptVerificationService;
