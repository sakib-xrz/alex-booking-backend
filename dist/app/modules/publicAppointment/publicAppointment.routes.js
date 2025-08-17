"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicAppointmentRoutes = void 0;
const express_1 = __importDefault(require("express"));
const publicAppointment_controller_1 = __importDefault(require("./publicAppointment.controller"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const publicAppointment_validation_1 = __importDefault(require("./publicAppointment.validation"));
const router = express_1.default.Router();
router.post('/', (0, validateRequest_1.default)(publicAppointment_validation_1.default.createPublicAppointmentZodSchema), publicAppointment_controller_1.default.PostAppointment);
router.get('/:id', publicAppointment_controller_1.default.getAppointment);
exports.PublicAppointmentRoutes = router;
