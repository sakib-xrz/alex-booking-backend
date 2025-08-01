"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientRoutes = void 0;
const express_1 = __importDefault(require("express"));
// import validateRequest from '../../middlewares/validateRequest';
// import ClientController from './client.controller';
// import ClientValidation from './client.validation';
const router = express_1.default.Router();
// router.post(
//   '/',
//   validateRequest(ClientValidation.createClientSchema),
//   ClientController.CreateClient,
// );
// router.get(
//   '/:id',
//   validateRequest(ClientValidation.verifyClientSchema),
//   ClientController.GetClient,
// );
// router.patch(
//   '/:id/verify',
//   validateRequest(ClientValidation.verifyClientSchema),
//   ClientController.VerifyClient,
// );
exports.ClientRoutes = router;
