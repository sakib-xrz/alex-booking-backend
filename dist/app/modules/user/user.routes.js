"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoute = void 0;
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("./user.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const client_1 = require("@prisma/client");
const handelFile_1 = require("../../utils/handelFile");
const router = express_1.default.Router();
router.patch('/profile-picture', (0, auth_1.default)(client_1.Role.SUPER_ADMIN, client_1.Role.COUNSELOR), handelFile_1.upload.single('image'), user_controller_1.UserController.UpdateProfilePicture);
exports.UserRoute = router;
