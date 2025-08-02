"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentRoutes = void 0;
const express_1 = __importDefault(require("express"));
const appointment_controller_1 = __importDefault(require("./appointment.controller"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
router.use((0, auth_1.default)(client_1.Role.SUPER_ADMIN, client_1.Role.COUNSELOR));
router.get('/', appointment_controller_1.default.GetCounselorAppointments);
router.get('/:appointmentId', appointment_controller_1.default.GetCounselorAppointmentDetailsById);
exports.AppointmentRoutes = router;
