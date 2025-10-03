import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import pick from '../../utils/pick';
import { BalanceService } from './balance.services';
import { Request, Response } from 'express';

const getCounsellorBalance = catchAsync(async (req: Request, res: Response) => {
  const { counsellor_id } = req.params;
  const result = await BalanceService.getCounsellorBalance(counsellor_id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Counsellor balance retrieved successfully',
    data: result,
  });
});

const getMyBalance = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const result = await BalanceService.getCounsellorBalance(userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Balance retrieved successfully',
    data: result,
  });
});

const getBalanceTransactions = catchAsync(
  async (req: Request, res: Response) => {
    const { counsellor_id } = req.params;
    const filters = pick(req.query, ['search']);
    const paginationOptions = pick(req.query, [
      'page',
      'limit',
      'sort_by',
      'sort_order',
    ]);

    const result = await BalanceService.getBalanceTransactions(
      counsellor_id,
      filters,
      paginationOptions,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Balance transactions retrieved successfully',
      data: result,
    });
  },
);

const getMyBalanceTransactions = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const filters = pick(req.query, ['search']);
    const paginationOptions = pick(req.query, [
      'page',
      'limit',
      'sort_by',
      'sort_order',
    ]);

    const result = await BalanceService.getBalanceTransactions(
      userId,
      filters,
      paginationOptions,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Balance transactions retrieved successfully',
      data: result,
    });
  },
);

const getAllCounsellorBalances = catchAsync(
  async (req: Request, res: Response) => {
    const filters = pick(req.query, ['search']);
    const paginationOptions = pick(req.query, [
      'page',
      'limit',
      'sort_by',
      'sort_order',
    ]);

    const result = await BalanceService.getAllCounsellorBalances(
      filters,
      paginationOptions,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'All counsellor balances retrieved successfully',
      data: result,
    });
  },
);

const adjustBalance = catchAsync(async (req: Request, res: Response) => {
  const { counsellor_id } = req.params;
  const { amount, description } = req.body;
  const processed_by = req.user?.id;

  const result = await BalanceService.adjustBalance(
    counsellor_id,
    amount,
    description,
    processed_by,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Balance adjusted successfully',
    data: result,
  });
});

export const BalanceController = {
  getCounsellorBalance,
  getMyBalance,
  getBalanceTransactions,
  getMyBalanceTransactions,
  getAllCounsellorBalances,
  adjustBalance,
};
