"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicAppointmentRoutes = void 0;
const express_1 = __importDefault(require("express"));
const publicAppointment_controller_1 = __importDefault(require("./publicAppointment.controller"));
const router = express_1.default.Router();
router.post('/', publicAppointment_controller_1.default.PostAppointment);
exports.PublicAppointmentRoutes = router;
