export const appointmentSearchableFields = [
  'first_name',
  'last_name',
  'email',
  'phone',
];
export const appointmentFilterableFields = [
  'session_type',
  'status',
  'date',
  'page',
  'limit',
  'sort_by',
  'sort_order',
  'search',
];

const AppointmentConstants = {
  appointmentSearchableFields,
  appointmentFilterableFields,
};

export default AppointmentConstants;
