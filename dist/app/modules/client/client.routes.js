"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientRoutes = void 0;
const express_1 = __importDefault(require("express"));
const client_controller_1 = __importDefault(require("./client.controller"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const client_1 = require("@prisma/client");
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const client_validation_1 = __importDefault(require("./client.validation"));
const router = express_1.default.Router();
router.use((0, auth_1.default)(client_1.Role.SUPER_ADMIN, client_1.Role.COUNSELOR));
router.get('/', client_controller_1.default.GetCounselorClients);
router.get('/:clientId', (0, validateRequest_1.default)(client_validation_1.default.getClientDetailsSchema), client_controller_1.default.GetClientDetailsWithHistory);
exports.ClientRoutes = router;
