import Stripe from 'stripe';
import prisma from '../../utils/prisma';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import { encrypt, createStripeInstance } from '../../utils/crypto';

type UserStripeInfo = {
  id: string;
  name: string;
  email: string;
  is_stripe_connected: boolean;
  stripe_public_key: string | null;
  stripe_account_id: string | null;
  created_at: Date;
  updated_at: Date;
};

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

// Validate Stripe secret key and get account ID
const validateStripeKeyAndGetAccount = async (
  secretKey: string,
): Promise<{ isValid: boolean; accountId?: string }> => {
  try {
    const testStripe = new Stripe(secretKey);

    // Retrieve account balance to validate the key
    await testStripe.balance.retrieve();

    // Retrieve account information to get the account ID
    const account = await testStripe.accounts.retrieve();
    console.log('stripe account', account);

    return {
      isValid: true,
      accountId: account.id,
    };
  } catch (error) {
    console.error('Stripe key validation error:', error);
    return {
      isValid: false,
    };
  }
};

// Connect Stripe account for counsellor
const connectStripeAccount = async (
  data: ConnectStripeAccountData,
): Promise<UserStripeInfo> => {
  // Validate Stripe keys and get account ID
  const validation = await validateStripeKeyAndGetAccount(
    data.stripe_secret_key,
  );

  if (!validation.isValid || !validation.accountId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Invalid Stripe secret key. Please check your credentials and try again.',
    );
  }

  // Encrypt the secret key before storing
  const encryptedSecretKey = encrypt(data.stripe_secret_key);

  // Update user with Stripe account details
  const updatedUser = await prisma.user.update({
    where: { id: data.counsellor_id },
    data: {
      stripe_public_key: data.stripe_public_key,
      stripe_secret_key: encryptedSecretKey,
      stripe_account_id: validation.accountId,
      is_stripe_connected: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      is_stripe_connected: true,
      stripe_public_key: true,
      stripe_account_id: true,
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
    // Validate the new secret key and get account ID
    const validation = await validateStripeKeyAndGetAccount(
      data.stripe_secret_key,
    );

    if (!validation.isValid || !validation.accountId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Invalid Stripe secret key. Please check your credentials and try again.',
      );
    }

    // Encrypt the secret key before storing
    updateData.stripe_secret_key = encrypt(data.stripe_secret_key);
    updateData.stripe_account_id = validation.accountId;
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
      stripe_account_id: true,
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
      stripe_account_id: true,
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

// Verify Stripe account balance
const verifyStripeAccount = async (
  counsellor_id: string,
): Promise<{
  is_valid: boolean;
  balance?: Stripe.Balance;
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
    // Decrypt the secret key and create a Stripe instance
    const counsellorStripe = createStripeInstance(user.stripe_secret_key);

    // Retrieve the account balance
    const balance = await counsellorStripe.balance.retrieve();

    return {
      is_valid: true,
      balance,
    };
  } catch (error) {
    console.error('Stripe verification error:', error);
    return {
      is_valid: false,
      error:
        error instanceof Error ? error.message : 'Invalid Stripe credentials',
    };
  }
};

// Helper function to get counsellor's Stripe instance (for internal use)
export const getCounsellorStripeInstance = async (
  counsellor_id: string,
): Promise<Stripe> => {
  const user = await prisma.user.findUnique({
    where: { id: counsellor_id },
    select: {
      stripe_secret_key: true,
      is_stripe_connected: true,
    },
  });

  if (!user || !user.is_stripe_connected || !user.stripe_secret_key) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Stripe account not connected for this counsellor',
    );
  }

  try {
    return createStripeInstance(user.stripe_secret_key);
  } catch (error) {
    console.error('Stripe instance initialization error:', error);
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to initialize Stripe instance',
    );
  }
};

export const StripeService = {
  connectStripeAccount,
  updateStripeAccount,
  disconnectStripeAccount,
  getStripeAccountStatus,
  verifyStripeAccount,
  getCounsellorStripeInstance,
};
