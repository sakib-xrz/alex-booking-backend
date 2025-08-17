"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appointmentFilterableFields = exports.appointmentSearchableFields = void 0;
exports.appointmentSearchableFields = [
    'first_name',
    'last_name',
    'email',
    'phone',
];
exports.appointmentFilterableFields = [
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
    appointmentSearchableFields: exports.appointmentSearchableFields,
    appointmentFilterableFields: exports.appointmentFilterableFields,
};
exports.default = AppointmentConstants;
