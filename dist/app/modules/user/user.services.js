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
exports.UserService = void 0;
const prisma_1 = __importDefault(require("../../utils/prisma"));
const path_1 = __importDefault(require("path"));
const handelFile_1 = require("../../utils/handelFile");
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const UpdateProfilePicture = (id, file) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_1.default.user.findUnique({
        where: { id, is_deleted: false },
    });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    let profilePicture = user.profile_picture || null;
    try {
        if (user.profile_picture) {
            const key = (0, handelFile_1.extractKeyFromUrl)(user.profile_picture);
            if (key) {
                yield (0, handelFile_1.deleteFromSpaces)(key);
            }
        }
        const uploadResult = yield (0, handelFile_1.uploadToSpaces)(file, {
            folder: 'profile-pictures',
            filename: `profile_picture_${Date.now()}${path_1.default.extname(file.originalname)}`,
        });
        profilePicture = (uploadResult === null || uploadResult === void 0 ? void 0 : uploadResult.url) || null;
    }
    catch (error) {
        console.log('Error from DigitalOcean Spaces while uploading profile picture', error);
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Failed to upload profile picture');
    }
    const result = yield prisma_1.default.user.update({
        where: { id },
        data: { profile_picture: profilePicture },
        select: {
            id: true,
            name: true,
            email: true,
            profile_picture: true,
            role: true,
            created_at: true,
            updated_at: true,
        },
    });
    return result;
});
const UpdateUserProfile = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_1.default.user.findUnique({
        where: { id, is_deleted: false },
    });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    const result = yield prisma_1.default.user.update({
        where: { id },
        data,
        select: {
            id: true,
            name: true,
            email: true,
            profile_picture: true,
            role: true,
            created_at: true,
            updated_at: true,
        },
    });
    return result;
});
exports.UserService = {
    UpdateProfilePicture,
    UpdateUserProfile,
};
