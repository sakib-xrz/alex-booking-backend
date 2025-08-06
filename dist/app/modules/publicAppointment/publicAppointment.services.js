"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const prisma_1 = __importDefault(require("../../utils/prisma"));
const CreateAppointment = (clientData, appointmentData) => __awaiter(void 0, void 0, void 0, function* () {
    // Check expected slot is available
    const expectedSlot = yield prisma_1.default.timeSlot.findFirst({
        where: {
            id: appointmentData.time_slot_id,
            status: 'AVAILABLE',
        },
        include: {
            calendar: {
                include: {
                    counselor: true,
                },
            },
        },
    });
    if (!expectedSlot) {
        throw new AppError_1.default(http_status_1.default.UNPROCESSABLE_ENTITY, 'Slot is not available.');
    }
    // Verify the session type matches the slot type
    if (expectedSlot.type !== appointmentData.session_type) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Session type does not match the selected time slot type.');
    }
    // Verify the counselor matches
    if (expectedSlot.calendar.counselor_id !== appointmentData.counselor_id) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Counselor does not match the selected time slot.');
    }
    const appointment = yield prisma_1.default.$transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
        let client_id;
        // 1. Check if the client exists
        const existingClient = yield transaction.client.findUnique({
            where: {
                email: clientData.email,
            },
        });
        if (existingClient === null || existingClient === void 0 ? void 0 : existingClient.id) {
            client_id = existingClient.id;
            // Update existing client data if needed
            yield transaction.client.update({
                where: { id: client_id },
                data: {
                    first_name: clientData.first_name,
                    last_name: clientData.last_name,
                    phone: clientData.phone,
                    date_of_birth: new Date(clientData.date_of_birth).toISOString(),
                    gender: clientData.gender,
                },
            });
        }
        else {
            // 2. Create new client
            const newClient = yield transaction.client.create({
                data: {
                    first_name: clientData.first_name,
                    last_name: clientData.last_name,
                    email: clientData.email,
                    phone: clientData.phone,
                    date_of_birth: new Date(clientData.date_of_birth).toISOString(),
                    gender: clientData.gender,
                },
            });
            client_id = newClient.id;
        }
        // 3. Mark the time slot as PROCESSING to prevent double booking
        yield transaction.timeSlot.update({
            where: { id: expectedSlot.id },
            data: { status: 'PROCESSING' },
        });
        console.log('Appointment data from line 102:', appointmentData);
        // 4. Create Appointment with PENDING status
        const newAppointment = yield transaction.appointment.create({
            data: {
                client_id,
                time_slot_id: expectedSlot.id,
                counselor_id: appointmentData.counselor_id,
                date: new Date(appointmentData.date).toISOString(),
                session_type: appointmentData.session_type,
                notes: appointmentData.notes,
                status: 'PENDING',
            },
            include: {
                client: true,
                counselor: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                time_slot: true,
            },
        });
        console.log('Appointment created data from line 128:', newAppointment);
        return newAppointment;
    }));
    // Return appointment with payment required status
    return Object.assign(Object.assign({}, appointment), { requires_payment: true });
});
const PublicAppointmentService = { CreateAppointment };
exports.default = PublicAppointmentService;
