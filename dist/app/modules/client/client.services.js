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
const CreateClientOrVerify = (client) => __awaiter(void 0, void 0, void 0, function* () {
    const data = {
        first_name: client.first_name,
        last_name: client.last_name,
        email: client.email,
        phone: client.phone,
        date_of_birth: client.date_of_birth,
        gender: client.gender,
    };
    const existingClient = yield prisma_1.default.client.findUnique({
        where: { email: client.email },
    });
    if (existingClient) {
        return {
            id: existingClient.id,
            first_name: existingClient.first_name,
            last_name: existingClient.last_name,
            email: existingClient.email,
            phone: existingClient.phone,
            date_of_birth: existingClient.date_of_birth,
            gender: existingClient.gender,
            is_verified: existingClient.is_verified,
            isExisting: true,
        };
    }
    const newClient = yield prisma_1.default.client.create({
        data,
    });
    return {
        id: newClient.id,
        first_name: newClient.first_name,
        last_name: newClient.last_name,
        email: newClient.email,
        phone: newClient.phone,
        date_of_birth: newClient.date_of_birth,
        gender: newClient.gender,
        is_verified: newClient.is_verified,
        isExisting: false,
    };
});
const GetClientById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield prisma_1.default.client.findUnique({
        where: { id },
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
            updated_at: true,
        },
    });
    return client;
});
const VerifyClient = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const updatedClient = yield prisma_1.default.client.update({
        where: { id },
        data: { is_verified: true },
        select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
            is_verified: true,
        },
    });
    return updatedClient;
});
const ClientService = {
    CreateClientOrVerify,
    GetClientById,
    VerifyClient,
};
exports.default = ClientService;
