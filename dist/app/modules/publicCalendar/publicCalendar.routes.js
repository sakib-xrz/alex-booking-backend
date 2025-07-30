"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicCalendarRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const publicCalendar_controller_1 = __importDefault(require("./publicCalendar.controller"));
const publicCalendar_validation_1 = __importDefault(require("./publicCalendar.validation"));
const router = express_1.default.Router();
router.get('/:counselorId', (0, validateRequest_1.default)(publicCalendar_validation_1.default.getCounselorCalendarSchema), publicCalendar_controller_1.default.GetCounselorCalendar);
router.get('/:counselorId/slots/:date', 
// validateRequest(PublicCalendarValidation.getCounselorCalendarSchema),
publicCalendar_controller_1.default.GetCounselorDateSlots);
router.get('/slots/:calenderId', (0, validateRequest_1.default)(publicCalendar_validation_1.default.getCounselorSlotsSchema), publicCalendar_controller_1.default.GetCounselorDateSlots);
exports.PublicCalendarRoutes = router;
