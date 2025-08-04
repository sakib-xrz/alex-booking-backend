import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import OptVerificationService from './optVerification.services';

const PostOtp = catchAsync(async (req, res) => {
  const data = req.body;

  const result = await OptVerificationService.CreateOpt(data);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'OTP sent successfully',
    data: result,
  });
});

const VerifyOtp = catchAsync(async (req, res) => {
  const data = req.body;

  const result = await OptVerificationService.VerifyOpt(data);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'OTP verified successfully',
    data: result,
  });
});

const OptVerificationController = { PostOtp, VerifyOtp };

export default OptVerificationController;
