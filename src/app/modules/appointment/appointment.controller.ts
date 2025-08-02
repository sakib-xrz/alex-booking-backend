import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import AppointmentService from './appointment.services';

const GetCounselorAppointments = catchAsync(async (req, res) => {
  const result = await AppointmentService.GetCounselorAppointmentsById(
    req.user.id,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Appointments retrieved successfully',
    data: result,
  });
});

const GetCounselorAppointmentDetailsById = catchAsync(async (req, res) => {
  const result = await AppointmentService.GetCounselorAppointmentDetailsById(
    req.params.appointmentId,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Appointment details retrieved successfully',
    data: result,
  });
});

const AppointmentController = {
  GetCounselorAppointments,
  GetCounselorAppointmentDetailsById,
};

export default AppointmentController;
