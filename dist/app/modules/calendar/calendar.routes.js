"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarRoutes = void 0;
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const calendar_controller_1 = __importDefault(require("./calendar.controller"));
const router = express_1.default.Router();
router.use((0, auth_1.default)(client_1.Role.SUPER_ADMIN, client_1.Role.COUNSELOR));
router
    .route('/')
    .get(calendar_controller_1.default.GetCalendar)
    .post(calendar_controller_1.default.PostCalendarDate);
router
    .route('/:id/slots')
    .get(calendar_controller_1.default.GetDateSlots)
    .post(calendar_controller_1.default.PostDateSlots);
exports.CalendarRoutes = router;
