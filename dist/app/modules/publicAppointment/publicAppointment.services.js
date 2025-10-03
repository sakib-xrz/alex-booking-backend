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
const retryTransaction = (operation_1, ...args_1) => __awaiter(void 0, [operation_1, ...args_1], void 0, function* (operation, maxRetries = 3, baseDelay = 1000) {
    var _a, _b;
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return yield operation();
        }
        catch (error) {
            lastError = error;
            const isRetryableError = (error === null || error === void 0 ? void 0 : error.code) === 'P2028' ||
                (error === null || error === void 0 ? void 0 : error.code) === 'P2034' ||
                ((_a = error === null || error === void 0 ? void 0 : error.message) === null || _a === void 0 ? void 0 : _a.includes('Transaction')) ||
                ((_b = error === null || error === void 0 ? void 0 : error.message) === null || _b === void 0 ? void 0 : _b.includes('timeout'));
            if (!isRetryableError || attempt === maxRetries) {
                throw error;
            }
            const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
            console.log(`Transaction attempt ${attempt} failed, retrying in ${delay}ms...`, error.message);
            yield new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
    throw lastError;
});
const CreateAppointment = (clientData, appointmentData) => __awaiter(void 0, void 0, void 0, function* () {
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
    if (expectedSlot.type !== appointmentData.session_type) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Session type does not match the selected time slot type.');
    }
    if (expectedSlot.calendar.counselor_id !== appointmentData.counselor_id) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Counselor does not match the selected time slot.');
    }
    const appointment = yield retryTransaction(() => prisma_1.default.$transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
        let client_id;
        try {
            const client = yield transaction.client.upsert({
                where: {
                    email: clientData.email,
                },
                update: {
                    first_name: clientData.first_name,
                    last_name: clientData.last_name,
                    phone: clientData.phone,
                    date_of_birth: new Date(clientData.date_of_birth).toISOString(),
                    gender: clientData.gender,
                },
                create: {
                    first_name: clientData.first_name,
                    last_name: clientData.last_name,
                    email: clientData.email,
                    phone: clientData.phone,
                    date_of_birth: new Date(clientData.date_of_birth).toISOString(),
                    gender: clientData.gender,
                },
            });
            client_id = client.id;
            console.log('Appointment data from line 102:', appointmentData);
            const [, newAppointment] = yield Promise.all([
                transaction.timeSlot.update({
                    where: { id: expectedSlot.id },
                    data: { status: 'PROCESSING' },
                }),
                transaction.appointment.create({
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
                }),
            ]);
            console.log('Appointment created data from line 128:', newAppointment);
            return newAppointment;
        }
        catch (error) {
            console.error('Transaction error in CreateAppointment:', error);
            throw error;
        }
    }), {
        timeout: 8000,
        maxWait: 3000,
    }), 3, 500);
    return Object.assign(Object.assign({}, appointment), { requires_payment: true });
});
const getAppointment = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const appointment = yield prisma_1.default.appointment.findUnique({
        where: { id },
        include: {
            client: true,
            counselor: true,
            time_slot: true,
            payment: true,
        },
    });
    if (!appointment) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Appointment not found');
    }
    return appointment;
});
const PublicAppointmentService = { CreateAppointment, getAppointment };
exports.default = PublicAppointmentService;
