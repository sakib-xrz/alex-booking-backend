import express from 'express';
import { Role } from '@prisma/client';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { UserController } from './user.controller';
import UserValidation from './user.validation';
import multer from 'multer';

const router = express.Router();
const upload = multer();

router.use(auth(Role.SUPER_ADMIN, Role.COUNSELOR));

router.get('/profile', UserController.GetProfile);

router.patch(
  '/profile',
  validateRequest(UserValidation.updateProfileSchema),
  UserController.UpdateProfile,
);

router.patch(
  '/profile/picture',
  upload.single('image'),
  UserController.UpdateProfilePicture,
);

export const UserRoutes = router;
