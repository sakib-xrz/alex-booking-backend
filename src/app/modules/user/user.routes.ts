import express from 'express';
import { UserController } from './user.controller';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';
import { upload } from '../../utils/handelFile';

const router = express.Router();

router.patch(
  '/profile-picture',
  auth(Role.SUPER_ADMIN, Role.COUNSELOR),
  upload.single('image'),
  UserController.UpdateProfilePicture,
);

export const UserRoute = router;
