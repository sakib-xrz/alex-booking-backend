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
exports.scheduledAutoCancelPendingJobs = void 0;
const date_fns_1 = require("date-fns");
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_1 = __importDefault(require("../../../utils/prisma"));
const autoCancelPendingAppointments = () => __awaiter(void 0, void 0, void 0, function* () {
    const fifteenMinutesAgo = (0, date_fns_1.subMinutes)(new Date(), 15);
    const pendingAppointments = yield prisma_1.default.appointment.findMany({
        where: {
            created_at: {
                lt: fifteenMinutesAgo,
            },
            AND: {
                status: 'PENDING',
            },
        },
    });
    pendingAppointments.map((appointment) => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield prisma_1.default.appointment.update({
            data: {
                status: 'DELETED',
                notes: 'Appointment canceled automatically lack of payment!',
                time_slot: {
                    update: {
                        status: 'AVAILABLE',
                    },
                },
                payment: {
                    update: {
                        status: 'DELETED',
                    },
                },
            },
            where: {
                id: appointment.id,
            },
        });
        return result;
    }));
});
const scheduledAutoCancelPendingJobs = () => {
    node_cron_1.default.schedule('*/15 * * * *', () => __awaiter(void 0, void 0, void 0, function* () {
        yield autoCancelPendingAppointments();
    }));
};
exports.scheduledAutoCancelPendingJobs = scheduledAutoCancelPendingJobs;
