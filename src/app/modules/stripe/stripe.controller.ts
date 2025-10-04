import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StripeService } from './stripe.services';
import { Request, Response } from 'express';

// Create or get Connect account onboarding link
const createConnectAccount = catchAsync(async (req: Request, res: Response) => {
  const counsellor_id = req.user?.id;

  const result = await StripeService.createConnectAccount({
    counsellor_id,
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Stripe Connect account link created successfully',
    data: result,
  });
});

// Refresh account status from Stripe
const refreshAccountStatus = catchAsync(async (req: Request, res: Response) => {
  const counsellor_id = req.user?.id;

  const result = await StripeService.refreshAccountStatus(counsellor_id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Stripe account status refreshed successfully',
    data: result,
  });
});

// Create new account link (for re-onboarding)
const createAccountLink = catchAsync(async (req: Request, res: Response) => {
  const counsellor_id = req.user?.id;

  const result = await StripeService.createAccountLink(counsellor_id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Stripe onboarding link created successfully',
    data: result,
  });
});

// Disconnect Stripe account
const disconnectStripeAccount = catchAsync(
  async (req: Request, res: Response) => {
    const counsellor_id = req.user?.id;

    const result = await StripeService.disconnectStripeAccount(counsellor_id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Stripe account disconnected successfully',
      data: result,
    });
  },
);

// Get Stripe account status
const getStripeAccountStatus = catchAsync(
  async (req: Request, res: Response) => {
    const counsellor_id = req.user?.id;

    const result = await StripeService.getStripeAccountStatus(counsellor_id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Stripe account status retrieved successfully',
      data: result,
    });
  },
);

// Get full Stripe account details
const getStripeAccountDetails = catchAsync(
  async (req: Request, res: Response) => {
    const counsellor_id = req.user?.id;

    const result = await StripeService.getStripeAccountDetails(counsellor_id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Stripe account details retrieved successfully',
      data: result,
    });
  },
);

// Create Stripe Express dashboard login link
const createLoginLink = catchAsync(async (req: Request, res: Response) => {
  const counsellor_id = req.user?.id;

  const result = await StripeService.createLoginLink(counsellor_id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Stripe dashboard login link created successfully',
    data: result,
  });
});

// Admin routes
const getCounsellorStripeStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { counsellor_id } = req.params;

    const result = await StripeService.getStripeAccountStatus(counsellor_id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Counsellor Stripe account status retrieved successfully',
      data: result,
    });
  },
);

const getCounsellorStripeDetails = catchAsync(
  async (req: Request, res: Response) => {
    const { counsellor_id } = req.params;

    const result = await StripeService.getStripeAccountDetails(counsellor_id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Counsellor Stripe account details retrieved successfully',
      data: result,
    });
  },
);

export const StripeController = {
  createConnectAccount,
  refreshAccountStatus,
  createAccountLink,
  disconnectStripeAccount,
  getStripeAccountStatus,
  getStripeAccountDetails,
  createLoginLink,
  getCounsellorStripeStatus,
  getCounsellorStripeDetails,
};
