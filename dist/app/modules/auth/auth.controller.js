"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const auth_services_1 = __importDefault(require("./auth.services"));
const handelFile_1 = require("../../utils/handelFile");
const Register = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield auth_services_1.default.Register(req.body);
    const { access_token } = result;
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Account created successfully',
        data: {
            access_token,
        },
    });
}));
const Login = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield auth_services_1.default.Login(req.body);
    const { access_token } = result;
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Login successful',
        data: {
            access_token,
        },
    });
}));
const ChangePassword = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield auth_services_1.default.ChangePassword(req.body, req.user);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Password changed successfully',
    });
}));
const GetMyProfile = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield auth_services_1.default.GetMyProfile(req.user);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'User profile retrieved successfully',
        data: result,
    });
}));
const UpdateProfile = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let profilePictureUrl;
    if (req.file) {
        const currentUser = yield auth_services_1.default.GetMyProfile(req.user);
        if (currentUser.profile_picture) {
            const oldKey = (0, handelFile_1.extractKeyFromUrl)(currentUser.profile_picture);
            if (oldKey) {
                try {
                    yield (0, handelFile_1.deleteFromSpaces)(oldKey);
                }
                catch (error) {
                    console.error('Failed to delete old profile picture:', error);
                }
            }
        }
        const uploadResult = yield (0, handelFile_1.uploadToSpaces)(req.file, {
            folder: 'profile-pictures',
        });
        profilePictureUrl = uploadResult.url;
    }
    const result = yield auth_services_1.default.UpdateProfile(req.body, profilePictureUrl, req.user);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Profile updated successfully',
        data: result,
    });
}));
const DeleteProfilePicture = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield auth_services_1.default.DeleteProfilePicture(req.user);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Profile picture deleted successfully',
        data: result,
    });
}));
const AuthController = {
    Login,
    ChangePassword,
    GetMyProfile,
    UpdateProfile,
    DeleteProfilePicture,
    Register,
};
exports.default = AuthController;
