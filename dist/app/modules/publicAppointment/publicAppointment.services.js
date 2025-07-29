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
const CreateAppointment = (clientData, appointmentDate) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(clientData, appointmentDate);
    // Check expected slot is available
    const expectedSlot = yield prisma_1.default.timeSlot.findFirst({
        where: {
            id: appointmentDate.time_slot_id,
            status: 'AVAILABLE',
        },
    });
    if (!expectedSlot) {
        throw new AppError_1.default(http_status_1.default.UNPROCESSABLE_ENTITY, 'Slot is not Available.');
    }
    const appointment = yield prisma_1.default.$transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
        let client_id;
        // 1. Check If the the client exist
        const existingClient = yield transaction.client.findUnique({
            where: {
                email: clientData.email,
            },
        });
        if (existingClient === null || existingClient === void 0 ? void 0 : existingClient.id) {
            client_id = existingClient.id;
        }
        else {
            // 2. Create new client
            const newClient = yield transaction.client.create({
                data: clientData,
            });
            client_id = newClient.id;
        }
        // 3. Create Appointment on PENDING status
        const newAppointment = yield transaction.appointment.create({
            data: {
                client_id,
                time_slot_id: expectedSlot.id,
                counselor_id: appointmentDate.counselor_id,
                date: appointmentDate.date,
                session_type: expectedSlot.type,
                notes: appointmentDate.notes,
                status: 'PENDING',
            },
        });
        // TODO:: May be payment related stuff @Sakib vai
        return newAppointment;
    }));
    // TODO:: Do the payment related stuff @Sakib vai
    const confirmedAppointment = yield prisma_1.default.$transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
        // 1. Update slot status
        yield transaction.timeSlot.update({
            where: {
                id: expectedSlot.id,
            },
            data: {
                status: 'BOOKED',
            },
        });
        // 2. Update Appointment Status to CONFIRMED
        const updatedAppointment = yield transaction.appointment.update({
            where: {
                id: appointment.id,
            },
            data: {
                status: 'CONFIRMED',
            },
        });
        return updatedAppointment;
    }));
    appointment.status = confirmedAppointment.status;
    return appointment;
});
const PublicAppointmentService = { CreateAppointment };
exports.default = PublicAppointmentService;
