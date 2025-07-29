// import httpStatus from 'http-status';
// import catchAsync from '../../utils/catchAsync';
// import sendResponse from '../../utils/sendResponse';
// import ClientService from './client.services';

// const CreateClient = catchAsync(async (req, res) => {
//   const result = await ClientService.CreateClientOrVerify(req.body);

//   sendResponse(res, {
//     success: true,
//     statusCode: httpStatus.CREATED,
//     message: 'Client processed successfully',
//     data: result,
//   });
// });

// const GetClient = catchAsync(async (req, res) => {
//   const result = await ClientService.GetClientById(req.params.id);

//   sendResponse(res, {
//     success: true,
//     statusCode: httpStatus.OK,
//     message: 'Client retrieved successfully',
//     data: result,
//   });
// });

// const VerifyClient = catchAsync(async (req, res) => {
//   const result = await ClientService.VerifyClient(req.params.id);

//   sendResponse(res, {
//     success: true,
//     statusCode: httpStatus.OK,
//     message: 'Client verified successfully',
//     data: result,
//   });
// });

// const ClientController = {
//   CreateClient,
//   GetClient,
//   VerifyClient,
// };

// export default ClientController;
