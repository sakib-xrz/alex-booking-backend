import Stripe from 'stripe';
import prisma from '../../utils/prisma';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import { stripe } from '../payment/payment.utils';
import config from '../../config';

type UserStripeInfo = {
  id: string;
  name: string;
  email: string;
  is_stripe_connected: boolean;
  stripe_account_id: string | null;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
  stripe_onboarding_complete: boolean;
  created_at: Date;
  updated_at: Date;
};

interface CreateConnectAccountData {
  counsellor_id: string;
}

interface ConnectAccountLinkResponse {
  url: string;
  account_id: string;
}

// Create Stripe Connect account for counsellor
const createConnectAccount = async (
  data: CreateConnectAccountData,
): Promise<ConnectAccountLinkResponse> => {
  // Get counsellor details
  const counsellor = await prisma.user.findUnique({
    where: { id: data.counsellor_id },
    select: {
      id: true,
      name: true,
      email: true,
      stripe_account_id: true,
      is_stripe_connected: true,
    },
  });

  if (!counsellor) {
    throw new AppError(httpStatus.NOT_FOUND, 'Counsellor not found');
  }

  let accountId = counsellor.stripe_account_id;

  // If account doesn't exist, create new Connect account
  if (!accountId) {
    try {
      const account = await stripe.accounts.create({
        type: 'express', // Express accounts are easier for counsellors
        country: 'AU', // Australia
        email: counsellor.email,
        capabilities: {
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          counsellor_id: counsellor.id,
          counsellor_name: counsellor.name,
        },
      });

      accountId = account.id;

      // Save account ID to database
      await prisma.user.update({
        where: { id: data.counsellor_id },
        data: {
          stripe_account_id: accountId,
        },
      });

      console.log(
        `Created Stripe Connect account ${accountId} for ${counsellor.name}`,
      );
    } catch (error) {
      console.error('Error creating Stripe Connect account:', error);
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Failed to create Stripe Connect account',
      );
    }
  }

  // Create account link for onboarding
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${config.base_url.admin_frontend}/stripe/refresh`,
      return_url: `${config.base_url.admin_frontend}/stripe/success`,
      type: 'account_onboarding',
    });

    return {
      url: accountLink.url,
      account_id: accountId,
    };
  } catch (error) {
    console.error('Error creating account link:', error);
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to create onboarding link',
    );
  }
};

// Refresh account capabilities (check onboarding status)
const refreshAccountStatus = async (
  counsellor_id: string,
): Promise<UserStripeInfo> => {
  const counsellor = await prisma.user.findUnique({
    where: { id: counsellor_id },
    select: { stripe_account_id: true },
  });

  if (!counsellor?.stripe_account_id) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'No Stripe account found for this counsellor',
    );
  }

  try {
    // Retrieve account details from Stripe
    const account = await stripe.accounts.retrieve(
      counsellor.stripe_account_id,
    );

    // Update database with current status
    const updatedUser = await prisma.user.update({
      where: { id: counsellor_id },
      data: {
        stripe_charges_enabled: account.charges_enabled,
        stripe_payouts_enabled: account.payouts_enabled,
        stripe_details_submitted: account.details_submitted,
        stripe_onboarding_complete:
          account.charges_enabled && account.payouts_enabled,
        is_stripe_connected: account.charges_enabled || account.payouts_enabled,
      },
      select: {
        id: true,
        name: true,
        email: true,
        is_stripe_connected: true,
        stripe_account_id: true,
        stripe_charges_enabled: true,
        stripe_payouts_enabled: true,
        stripe_onboarding_complete: true,
        created_at: true,
        updated_at: true,
      },
    });

    return updatedUser;
  } catch (error) {
    console.error('Error refreshing account status:', error);
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to refresh account status',
    );
  }
};

// Create new account link (for re-onboarding or continuing onboarding)
const createAccountLink = async (
  counsellor_id: string,
): Promise<ConnectAccountLinkResponse> => {
  const counsellor = await prisma.user.findUnique({
    where: { id: counsellor_id },
    select: { stripe_account_id: true, name: true },
  });

  if (!counsellor?.stripe_account_id) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'No Stripe account found. Please create one first.',
    );
  }

  try {
    const accountLink = await stripe.accountLinks.create({
      account: counsellor.stripe_account_id,
      refresh_url: `${config.base_url.admin_frontend}/stripe/refresh`,
      return_url: `${config.base_url.admin_frontend}/stripe/success`,
      type: 'account_onboarding',
    });

    return {
      url: accountLink.url,
      account_id: counsellor.stripe_account_id,
    };
  } catch (error) {
    console.error('Error creating account link:', error);
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to create account link',
    );
  }
};

// Disconnect Stripe account for counsellor
const disconnectStripeAccount = async (
  counsellor_id: string,
): Promise<UserStripeInfo> => {
  // Check if counsellor has pending payout requests
  const pendingPayouts = await prisma.payoutRequest.findFirst({
    where: {
      counsellor_id,
      status: { in: ['PENDING', 'APPROVED', 'PROCESSING'] },
    },
  });

  if (pendingPayouts) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Cannot disconnect Stripe account while you have pending payout requests',
    );
  }

  const counsellor = await prisma.user.findUnique({
    where: { id: counsellor_id },
    select: { stripe_account_id: true },
  });

  // Delete the Stripe Connect account
  if (counsellor?.stripe_account_id) {
    try {
      await stripe.accounts.del(counsellor.stripe_account_id);
      console.log(
        `Deleted Stripe Connect account ${counsellor.stripe_account_id}`,
      );
    } catch (error) {
      console.error('Error deleting Stripe account:', error);
      // Continue even if deletion fails - we'll still remove it from our database
    }
  }

  // Update user to disconnect Stripe account
  const updatedUser = await prisma.user.update({
    where: { id: counsellor_id },
    data: {
      stripe_account_id: null,
      stripe_charges_enabled: false,
      stripe_payouts_enabled: false,
      stripe_details_submitted: false,
      stripe_onboarding_complete: false,
      is_stripe_connected: false,
    },
    select: {
      id: true,
      name: true,
      email: true,
      is_stripe_connected: true,
      stripe_account_id: true,
      stripe_charges_enabled: true,
      stripe_payouts_enabled: true,
      stripe_onboarding_complete: true,
      created_at: true,
      updated_at: true,
    },
  });

  return updatedUser;
};

// Get Stripe account status for counsellor
const getStripeAccountStatus = async (
  counsellor_id: string,
): Promise<{
  is_connected: boolean;
  account_id?: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  onboarding_complete: boolean;
  details_submitted: boolean;
}> => {
  const user = await prisma.user.findUnique({
    where: { id: counsellor_id },
    select: {
      is_stripe_connected: true,
      stripe_account_id: true,
      stripe_charges_enabled: true,
      stripe_payouts_enabled: true,
      stripe_onboarding_complete: true,
      stripe_details_submitted: true,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  return {
    is_connected: user.is_stripe_connected,
    account_id: user.stripe_account_id || undefined,
    charges_enabled: user.stripe_charges_enabled,
    payouts_enabled: user.stripe_payouts_enabled,
    onboarding_complete: user.stripe_onboarding_complete,
    details_submitted: user.stripe_details_submitted,
  };
};

// Get Stripe account details from Stripe API
const getStripeAccountDetails = async (
  counsellor_id: string,
): Promise<Stripe.Account | null> => {
  const user = await prisma.user.findUnique({
    where: { id: counsellor_id },
    select: {
      stripe_account_id: true,
      is_stripe_connected: true,
    },
  });

  if (!user || !user.is_stripe_connected || !user.stripe_account_id) {
    return null;
  }

  try {
    const account = await stripe.accounts.retrieve(user.stripe_account_id);
    return account;
  } catch (error) {
    console.error('Error retrieving Stripe account:', error);
    return null;
  }
};

// Create login link for counsellor to access Stripe Express dashboard
const createLoginLink = async (
  counsellor_id: string,
): Promise<{ url: string }> => {
  const user = await prisma.user.findUnique({
    where: { id: counsellor_id },
    select: {
      stripe_account_id: true,
      is_stripe_connected: true,
    },
  });

  if (!user || !user.stripe_account_id) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'No Stripe account found for this counsellor',
    );
  }

  try {
    const loginLink = await stripe.accounts.createLoginLink(
      user.stripe_account_id,
    );
    return { url: loginLink.url };
  } catch (error) {
    console.error('Error creating login link:', error);
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to create Stripe dashboard link',
    );
  }
};

export const StripeService = {
  createConnectAccount,
  refreshAccountStatus,
  createAccountLink,
  disconnectStripeAccount,
  getStripeAccountStatus,
  getStripeAccountDetails,
  createLoginLink,
};
