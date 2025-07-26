import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import ClientService from './client.services';

const CreateClient = catchAsync(async (req, res) => {
  const result = await ClientService.CreateClientOrVerify(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Client created successfully',
    data: result,
  });
});

const ClientController = { CreateClient };

export default ClientController;
