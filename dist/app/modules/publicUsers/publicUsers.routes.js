"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicUsersRoutes = void 0;
const express_1 = __importDefault(require("express"));
const publicUsers_controller_1 = __importDefault(require("./publicUsers.controller"));
const router = express_1.default.Router();
router.get('/counselors', publicUsers_controller_1.default.GetPublicCounselors);
exports.PublicUsersRoutes = router;
