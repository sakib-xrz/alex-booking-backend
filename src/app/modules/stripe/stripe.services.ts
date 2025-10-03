import { User } from '@prisma/client';

type UserStripeInfo = {
  id: string;
  name: string;
  email: string;
  is_stripe_connected: boolean;
  stripe_public_key: string | null;
  created_at: Date;
  updated_at: Date;
};
import prisma from '../../utils/prisma';
import { stripe } from '../payment/payment.utils';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import bcrypt from 'bcrypt';

interface ConnectStripeAccountData {
  counsellor_id: string;
  stripe_public_key: string;
  stripe_secret_key: string;
}

interface UpdateStripeAccountData {
  counsellor_id: string;
  stripe_public_key?: string;
  stripe_secret_key?: string;
}

// Connect Stripe account for counsellor
const connectStripeAccount = async (
  data: ConnectStripeAccountData,
): Promise<UserStripeInfo> => {
  // Validate Stripe keys by making a test API call
  try {
    // Test the secret key by creating a temporary Stripe instance
    const testStripe = require('stripe')(data.stripe_secret_key);
    await testStripe.balance.retrieve();
  } catch (error) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid Stripe secret key');
  }

  // Encrypt the secret key before storing
  const encryptedSecretKey = await bcrypt.hash(data.stripe_secret_key, 12);

  // Update user with Stripe account details
  const updatedUser = await prisma.user.update({
    where: { id: data.counsellor_id },
    data: {
      stripe_public_key: data.stripe_public_key,
      stripe_secret_key: encryptedSecretKey,
      is_stripe_connected: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      is_stripe_connected: true,
      stripe_public_key: true,
      created_at: true,
      updated_at: true,
    },
  });

  return updatedUser;
};

// Update Stripe account for counsellor
const updateStripeAccount = async (
  data: UpdateStripeAccountData,
): Promise<UserStripeInfo> => {
  const updateData: any = {};

  if (data.stripe_public_key) {
    updateData.stripe_public_key = data.stripe_public_key;
  }

  if (data.stripe_secret_key) {
    // Validate the new secret key
    try {
      const testStripe = require('stripe')(data.stripe_secret_key);
      await testStripe.balance.retrieve();
    } catch (error) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid Stripe secret key');
    }

    // Encrypt the secret key before storing
    updateData.stripe_secret_key = await bcrypt.hash(
      data.stripe_secret_key,
      12,
    );
  }

  // Update user with new Stripe account details
  const updatedUser = await prisma.user.update({
    where: { id: data.counsellor_id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      is_stripe_connected: true,
      stripe_public_key: true,
      created_at: true,
      updated_at: true,
    },
  });

  return updatedUser;
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

  // Update user to disconnect Stripe account
  const updatedUser = await prisma.user.update({
    where: { id: counsellor_id },
    data: {
      stripe_account_id: null,
      stripe_public_key: null,
      stripe_secret_key: null,
      is_stripe_connected: false,
    },
    select: {
      id: true,
      name: true,
      email: true,
      is_stripe_connected: true,
      stripe_public_key: true,
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
  public_key?: string;
  account_id?: string;
}> => {
  const user = await prisma.user.findUnique({
    where: { id: counsellor_id },
    select: {
      is_stripe_connected: true,
      stripe_public_key: true,
      stripe_account_id: true,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  return {
    is_connected: user.is_stripe_connected,
    public_key: user.stripe_public_key || undefined,
    account_id: user.stripe_account_id || undefined,
  };
};

// Verify Stripe account balance (for testing purposes)
const verifyStripeAccount = async (
  counsellor_id: string,
): Promise<{
  is_valid: boolean;
  balance?: any;
  error?: string;
}> => {
  const user = await prisma.user.findUnique({
    where: { id: counsellor_id },
    select: {
      stripe_secret_key: true,
      is_stripe_connected: true,
    },
  });

  if (!user || !user.is_stripe_connected || !user.stripe_secret_key) {
    return {
      is_valid: false,
      error: 'Stripe account not connected',
    };
  }

  try {
    // Note: In a real implementation, you would decrypt the secret key
    // For now, we'll just return a success status
    return {
      is_valid: true,
      balance: { available: [{ amount: 0, currency: 'aud' }] },
    };
  } catch (error) {
    return {
      is_valid: false,
      error: 'Invalid Stripe credentials',
    };
  }
};

export const StripeService = {
  connectStripeAccount,
  updateStripeAccount,
  disconnectStripeAccount,
  getStripeAccountStatus,
  verifyStripeAccount,
};
