"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleRoutes = void 0;
const express_1 = __importDefault(require("express"));
const google_controller_1 = __importDefault(require("./google.controller"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
router.get('/auth-url', (0, auth_1.default)(client_1.Role.COUNSELOR, client_1.Role.SUPER_ADMIN), google_controller_1.default.getGoogleAuthUrl);
router.get('/callback', google_controller_1.default.handleGoogleCallback);
router.get('/status', (0, auth_1.default)(client_1.Role.COUNSELOR, client_1.Role.SUPER_ADMIN), google_controller_1.default.getCalendarStatus);
router.get('/debug', (0, auth_1.default)(client_1.Role.COUNSELOR, client_1.Role.SUPER_ADMIN), google_controller_1.default.debugUserGoogleData);
router.post('/refresh-account-info', (0, auth_1.default)(client_1.Role.COUNSELOR, client_1.Role.SUPER_ADMIN), google_controller_1.default.refreshGoogleAccountInfo);
router.delete('/disconnect', (0, auth_1.default)(client_1.Role.COUNSELOR, client_1.Role.SUPER_ADMIN), google_controller_1.default.disconnectCalendar);
exports.GoogleRoutes = router;
