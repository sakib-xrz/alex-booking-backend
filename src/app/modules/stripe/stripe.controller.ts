import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StripeService } from './stripe.services';
import { Request, Response } from 'express';

const connectStripeAccount = catchAsync(async (req: Request, res: Response) => {
  const counsellor_id = req.user?.id;
  const { stripe_public_key, stripe_secret_key } = req.body;

  const result = await StripeService.connectStripeAccount({
    counsellor_id,
    stripe_public_key,
    stripe_secret_key,
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Stripe account connected successfully',
    data: result,
  });
});

const updateStripeAccount = catchAsync(async (req: Request, res: Response) => {
  const counsellor_id = req.user?.id;
  const { stripe_public_key, stripe_secret_key } = req.body;

  const result = await StripeService.updateStripeAccount({
    counsellor_id,
    stripe_public_key,
    stripe_secret_key,
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Stripe account updated successfully',
    data: result,
  });
});

const disconnectStripeAccount = catchAsync(async (req: Request, res: Response) => {
  const counsellor_id = req.user?.id;

  const result = await StripeService.disconnectStripeAccount(counsellor_id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Stripe account disconnected successfully',
    data: result,
  });
});

const getStripeAccountStatus = catchAsync(async (req: Request, res: Response) => {
  const counsellor_id = req.user?.id;

  const result = await StripeService.getStripeAccountStatus(counsellor_id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Stripe account status retrieved successfully',
    data: result,
  });
});

const verifyStripeAccount = catchAsync(async (req: Request, res: Response) => {
  const counsellor_id = req.user?.id;

  const result = await StripeService.verifyStripeAccount(counsellor_id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Stripe account verification completed',
    data: result,
  });
});

// Admin routes
const getCounsellorStripeStatus = catchAsync(async (req: Request, res: Response) => {
  const { counsellor_id } = req.params;

  const result = await StripeService.getStripeAccountStatus(counsellor_id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Counsellor Stripe account status retrieved successfully',
    data: result,
  });
});

export const StripeController = {
  connectStripeAccount,
  updateStripeAccount,
  disconnectStripeAccount,
  getStripeAccountStatus,
  verifyStripeAccount,
  getCounsellorStripeStatus,
};
