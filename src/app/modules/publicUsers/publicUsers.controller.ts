import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import PublicUsersService from './publicUsers.services';

const GetPublicCounselors = catchAsync(async (req, res) => {
  const result = await PublicUsersService.GetPublicCounselors();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Counselors retrieved successfully',
    data: result,
  });
});

const PublicUsersController = {
  GetPublicCounselors,
};

export default PublicUsersController;
