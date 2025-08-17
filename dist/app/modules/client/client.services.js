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
const GetCounselorClientsById = (counselor_id) => __awaiter(void 0, void 0, void 0, function* () {
    const clients = yield prisma_1.default.client.findMany({
        where: {
            appointments: {
                every: {
                    counselor_id,
                },
            },
        },
        select: {
            first_name: true,
            last_name: true,
            email: true,
            gender: true,
            date_of_birth: true,
            phone: true,
            id: true,
            created_at: true,
            _count: {
                select: {
                    appointments: {
                        where: {
                            status: {
                                not: 'PENDING',
                            },
                        },
                    },
                },
            },
        },
        orderBy: {
            created_at: 'asc',
        },
    });
    const formattedClients = clients.map((client) => ({
        id: client.id,
        firstName: client.first_name,
        lastName: client.last_name,
        email: client.email,
        phone: client.phone,
        gender: client.gender,
        totalAppointments: client._count.appointments,
        dateOfBirth: client.date_of_birth,
        createdAt: client.created_at,
    }));
    return formattedClients;
});
const ClientService = {
    GetCounselorClientsById,
};
exports.default = ClientService;
