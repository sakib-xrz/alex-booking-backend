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
const prisma_1 = __importDefault(require("../../utils/prisma"));
const pagination_1 = __importDefault(require("../../utils/pagination"));
const client_constant_1 = require("./client.constant");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const GetCounselorClientsById = (counselor_id, filters, paginationOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip, sort_by, sort_order } = (0, pagination_1.default)(paginationOptions);
    const { search, gender } = filters;
    const whereConditions = {
        appointments: {
            some: {
                counselor_id,
                status: {
                    not: 'PENDING',
                },
            },
        },
        is_deleted: false,
    };
    if (search) {
        whereConditions.OR = client_constant_1.clientSearchableFields.map((field) => ({
            [field]: {
                contains: search,
                mode: 'insensitive',
            },
        }));
    }
    if (gender) {
        whereConditions.gender = gender;
    }
    const orderBy = {};
    if (sort_by === 'first_name') {
        orderBy.first_name = sort_order;
    }
    else if (sort_by === 'last_name') {
        orderBy.last_name = sort_order;
    }
    else if (sort_by === 'email') {
        orderBy.email = sort_order;
    }
    else if (sort_by === 'gender') {
        orderBy.gender = sort_order;
    }
    else if (sort_by === 'date_of_birth') {
        orderBy.date_of_birth = sort_order;
    }
    else {
        orderBy.created_at = sort_order;
    }
    const total = yield prisma_1.default.client.count({
        where: whereConditions,
    });
    const clients = yield prisma_1.default.client.findMany({
        where: whereConditions,
        select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
            gender: true,
            date_of_birth: true,
            created_at: true,
            _count: {
                select: {
                    appointments: {
                        where: {
                            counselor_id,
                            status: {
                                not: 'PENDING',
                            },
                        },
                    },
                },
            },
        },
        orderBy,
        skip,
        take: limit,
    });
    const formattedClients = clients.map((client) => ({
        id: client.id,
        firstName: client.first_name,
        lastName: client.last_name,
        email: client.email,
        phone: client.phone,
        gender: client.gender,
        dateOfBirth: client.date_of_birth,
        totalAppointments: client._count.appointments,
        createdAt: client.created_at,
    }));
    return {
        data: formattedClients,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
});
const GetClientDetailsWithHistory = (clientId, counselorId) => __awaiter(void 0, void 0, void 0, function* () {
    const clientExists = yield prisma_1.default.client.findFirst({
        where: {
            id: clientId,
            is_deleted: false,
            appointments: {
                some: {
                    counselor_id: counselorId,
                    status: {
                        not: 'PENDING',
                    },
                },
            },
        },
    });
    if (!clientExists) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Client not found or not associated with this counselor');
    }
    const client = yield prisma_1.default.client.findUnique({
        where: {
            id: clientId,
        },
        select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
            date_of_birth: true,
            gender: true,
            is_verified: true,
            created_at: true,
            appointments: {
                where: {
                    counselor_id: counselorId,
                    status: {
                        not: 'PENDING',
                    },
                },
                select: {
                    id: true,
                    date: true,
                    session_type: true,
                    status: true,
                    notes: true,
                    is_rescheduled: true,
                    time_slot: {
                        select: {
                            start_time: true,
                            end_time: true,
                        },
                    },
                    payment: {
                        select: {
                            amount: true,
                            currency: true,
                            status: true,
                            transaction_id: true,
                            processed_at: true,
                        },
                    },
                    meeting: {
                        select: {
                            platform: true,
                            link: true,
                        },
                    },
                    created_at: true,
                },
                orderBy: {
                    date: 'desc',
                },
            },
            _count: {
                select: {
                    appointments: {
                        where: {
                            counselor_id: counselorId,
                            status: 'COMPLETED',
                        },
                    },
                },
            },
        },
    });
    if (!client) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Client not found');
    }
    const formattedClient = {
        id: client.id,
        firstName: client.first_name,
        lastName: client.last_name,
        email: client.email,
        phone: client.phone,
        dateOfBirth: client.date_of_birth,
        gender: client.gender,
        isVerified: client.is_verified,
        totalCompletedAppointments: client._count.appointments,
        createdAt: client.created_at,
        appointmentHistory: client.appointments.map((appointment) => ({
            id: appointment.id,
            sessionType: appointment.session_type,
            appointmentDate: appointment.date,
            startTime: appointment.time_slot.start_time,
            endTime: appointment.time_slot.end_time,
            status: appointment.status,
            notes: appointment.notes,
            isRescheduled: appointment.is_rescheduled,
            payment: appointment.payment
                ? {
                    amount: appointment.payment.amount,
                    currency: appointment.payment.currency,
                    status: appointment.payment.status,
                    transactionId: appointment.payment.transaction_id,
                    processedAt: appointment.payment.processed_at,
                }
                : null,
            meeting: appointment.meeting
                ? {
                    platform: appointment.meeting.platform,
                    link: appointment.meeting.link,
                }
                : null,
            createdAt: appointment.created_at,
        })),
    };
    return formattedClient;
});
const ClientService = {
    GetCounselorClientsById,
    GetClientDetailsWithHistory,
};
exports.default = ClientService;
