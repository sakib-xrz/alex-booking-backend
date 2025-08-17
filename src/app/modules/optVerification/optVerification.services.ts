import { addMinutes, differenceInSeconds } from 'date-fns';
import prisma from '../../utils/prisma';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import emailQueue from '../../utils/emailQueue';
import OptVerificationUtils from './optVerification.utils';
import {
  OTP_EXPIRY_MINUTES,
  OTP_RATE_LIMIT_SECONDS,
} from './optVerification.constant';

const CreateOpt = async ({ email }: { email: string }) => {
  // Check if there's an existing OTP record for this email
  const existingOTPRecord = await prisma.emailOTPVerification.findFirst({
    where: {
      email,
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  // Check rate limiting: don't allow new OTP request within 120 seconds of last one
  if (existingOTPRecord) {
    const secondsSinceLastOTP = differenceInSeconds(
      new Date(),
      existingOTPRecord.created_at,
    );

    if (secondsSinceLastOTP < OTP_RATE_LIMIT_SECONDS) {
      const remainingTime = OTP_RATE_LIMIT_SECONDS - secondsSinceLastOTP;
      throw new AppError(
        httpStatus.TOO_MANY_REQUESTS,
        `Please wait ${remainingTime} seconds before requesting a new OTP`,
      );
    }
  }

  // Generate new OTP and set expiry time
  const otp = OptVerificationUtils.generateOTP();
  const expires_at = addMinutes(new Date(), OTP_EXPIRY_MINUTES);

  const result = await prisma.emailOTPVerification.create({
    data: {
      email,
      otp,
      expires_at,
    },
  });

  // Queue the email for async processing to avoid blocking the response
  try {
    const emailTemplate = OptVerificationUtils.createOTPEmailTemplate(otp);
    const emailJobId = await emailQueue.addEmail(
      email,
      'Email Verification - Your OTP Code',
      emailTemplate,
    );

    console.log(`OTP email queued for ${email} with job ID: ${emailJobId}`);
  } catch (error) {
    console.error('Failed to queue email:', error);

    // Delete the OTP record if we can't even queue the email
    await prisma.emailOTPVerification.delete({
      where: { id: result.id },
    });

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to process OTP request. Please try again.',
    );
  }

  // Return success response without exposing the OTP
  return {
    email: result.email,
    expires_at: result.expires_at,
    is_verified: result.is_verified,
    message: 'OTP generated and email is being sent',
  };
};

const VerifyOpt = async ({ email, otp }: { email: string; otp: string }) => {
  // Convert string OTP to number for database comparison
  const otpNumber = parseInt(otp, 10);

  const isVerifiedEmail = await prisma.emailOTPVerification.findFirst({
    where: {
      email,
      otp: otpNumber,
      expires_at: { gt: new Date() },
      is_verified: false,
    },
  });

  if (!isVerifiedEmail) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Invalid OTP or OTP has expired',
    );
  }

  const result = await prisma.emailOTPVerification.update({
    where: { id: isVerifiedEmail.id },
    data: { is_verified: true },
  });

  return {
    email: result.email,
    is_verified: result.is_verified,
  };
};

const OptVerificationService = { VerifyOpt, CreateOpt };

export default OptVerificationService;
