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
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../../utils/prisma"));
const GetPublicCounselors = () => __awaiter(void 0, void 0, void 0, function* () {
    const counselors = yield prisma_1.default.user.findMany({
        where: {
            OR: [{ role: client_1.Role.SUPER_ADMIN }, { role: client_1.Role.COUNSELOR }],
            is_deleted: false,
        },
        select: {
            id: true,
            name: true,
            role: true,
            specialization: true,
            profile_picture: true,
        },
        orderBy: [
            { role: 'asc' },
            { name: 'asc' },
        ],
    });
    const counselorsWithAvailability = yield Promise.all(counselors.map((counselor) => __awaiter(void 0, void 0, void 0, function* () {
        const nextAvailableCalendar = yield prisma_1.default.calendar.findFirst({
            where: {
                counselor_id: counselor.id,
                date: {
                    gte: new Date(),
                },
                time_slots: {
                    some: {
                        status: 'AVAILABLE',
                    },
                },
            },
            orderBy: {
                date: 'asc',
            },
            select: {
                date: true,
            },
        });
        let next_available = null;
        if (nextAvailableCalendar) {
            const today = new Date();
            const availableDate = new Date(nextAvailableCalendar.date);
            const diffTime = availableDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays === 0) {
                next_available = 'Today';
            }
            else if (diffDays === 1) {
                next_available = 'Tomorrow';
            }
            else {
                next_available = availableDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                });
            }
        }
        else {
            next_available = null;
        }
        return Object.assign(Object.assign({}, counselor), { next_available });
    })));
    return counselorsWithAvailability;
});
const PublicUsersService = {
    GetPublicCounselors,
};
exports.default = PublicUsersService;
