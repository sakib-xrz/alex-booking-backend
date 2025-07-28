"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const client_controller_1 = __importDefault(require("./client.controller"));
const client_validation_1 = __importDefault(require("./client.validation"));
const router = express_1.default.Router();
router.post('/', (0, validateRequest_1.default)(client_validation_1.default.createClientSchema), client_controller_1.default.CreateClient);
router.get('/:id', (0, validateRequest_1.default)(client_validation_1.default.verifyClientSchema), client_controller_1.default.GetClient);
router.patch('/:id/verify', (0, validateRequest_1.default)(client_validation_1.default.verifyClientSchema), client_controller_1.default.VerifyClient);
exports.ClientRoutes = router;
