import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import pick from '../../utils/pick';
import { PayoutService } from './payout.services';
import { Request, Response } from 'express';

const createPayoutRequest = catchAsync(async (req: Request, res: Response) => {
  const counsellor_id = req.user?.id;
  const { amount, notes } = req.body;

  const result = await PayoutService.createPayoutRequest({
    counsellor_id,
    amount,
    notes,
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Payout request created successfully',
    data: result,
  });
});

const getMyPayoutRequests = catchAsync(async (req: Request, res: Response) => {
  const counsellor_id = req.user?.id;
  const filters = pick(req.query, ['search', 'status', 'counsellor_id']);
  const paginationOptions = pick(req.query, [
    'page',
    'limit',
    'sort_by',
    'sort_order',
  ]);

  const result = await PayoutService.getCounsellorPayoutRequests(
    counsellor_id,
    filters,
    paginationOptions,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Payout requests retrieved successfully',
    data: result,
  });
});

const getAllPayoutRequests = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ['search', 'status', 'counsellor_id']);
  const paginationOptions = pick(req.query, [
    'page',
    'limit',
    'sort_by',
    'sort_order',
  ]);

  const result = await PayoutService.getAllPayoutRequests(
    filters,
    paginationOptions,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'All payout requests retrieved successfully',
    data: result,
  });
});

const getCounsellorPayoutRequests = catchAsync(
  async (req: Request, res: Response) => {
    const { counsellor_id } = req.params;
    const filters = pick(req.query, ['search', 'status', 'counsellor_id']);
    const paginationOptions = pick(req.query, [
      'page',
      'limit',
      'sort_by',
      'sort_order',
    ]);

    const result = await PayoutService.getCounsellorPayoutRequests(
      counsellor_id,
      filters,
      paginationOptions,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Counsellor payout requests retrieved successfully',
      data: result,
    });
  },
);

const getPayoutRequestById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PayoutService.getPayoutRequestById(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Payout request retrieved successfully',
    data: result,
  });
});

const processPayoutRequest = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { action, rejection_reason } = req.body;
  const processed_by = req.user?.id;

  const result = await PayoutService.processPayoutRequest({
    payout_request_id: id,
    action,
    rejection_reason,
    processed_by,
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: `Payout request ${action}d successfully`,
    data: result,
  });
});

const executePayout = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PayoutService.executePayout(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Payout executed successfully',
    data: result,
  });
});

export const PayoutController = {
  createPayoutRequest,
  getMyPayoutRequests,
  getAllPayoutRequests,
  getCounsellorPayoutRequests,
  getPayoutRequestById,
  processPayoutRequest,
  executePayout,
};
