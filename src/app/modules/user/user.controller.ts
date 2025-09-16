import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { UserService } from './user.services';
import AppError from '../../errors/AppError';

const UpdateProfilePicture = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Image is required');
  }

  const result = await UserService.UpdateProfilePicture(req.user.id, req.file);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Profile picture updated successfully',
    data: result,
  });
});

const UpdateProfile = catchAsync(async (req, res) => {
  const result = await UserService.UpdateUserProfile(req.user.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Profile updated successfully',
    data: result,
  });
});

const CreateCounselor = catchAsync(async (req, res) => {
  const result = await UserService.CreateCounselor(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Counselor created successfully',
    data: result,
  });
});

export const UserController = {
  UpdateProfilePicture,
  UpdateProfile,
  CreateCounselor,
};
