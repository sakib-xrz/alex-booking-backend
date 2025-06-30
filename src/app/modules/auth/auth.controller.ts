import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import AuthService from './auth.services';

const Register = catchAsync(async (req, res) => {
  const result = await AuthService.Register(req.body);

  const { access_token } = result;

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Account created successfully',
    data: {
      access_token,
    },
  });
});

const Login = catchAsync(async (req, res) => {
  const result = await AuthService.Login(req.body);

  const { access_token } = result;

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Login successful',
    data: {
      access_token,
    },
  });
});

const ChangePassword = catchAsync(async (req, res) => {
  await AuthService.ChangePassword(req.body, req.user);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Password changed successfully',
  });
});

const GetMyProfile = catchAsync(async (req, res) => {
  const result = await AuthService.GetMyProfile(req.user);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'User profile retrieved successfully',
    data: result,
  });
});

const AuthController = {
  Login,
  ChangePassword,
  GetMyProfile,
  Register,
};

export default AuthController;
