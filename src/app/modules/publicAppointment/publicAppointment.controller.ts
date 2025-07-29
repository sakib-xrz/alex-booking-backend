import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import PublicAppointmentService from './publicAppointment.services';

const PostAppointment = catchAsync(async (req, res) => {
  const data = req.body;
  const clientData = {
    name: data.name,
    email: data.email,
    phone: data.phone,
    date_of_birth: data.dateOfBirth,
    gender: data.gender || 'OTHER',
  };

  const appointmentDate = {
    session_type: data.sessionType,
    date: data.date,
    time_slot_id: data.timeSlotId,
    notes: data.notes || 'N/A',
    counselor_id: data.counselorId,
  };

  const result = await PublicAppointmentService.CreateAppointment(
    clientData,
    appointmentDate,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Appointment created successfully',
    data: result,
  });
});

const PublicAppointmentController = { PostAppointment };

export default PublicAppointmentController;
