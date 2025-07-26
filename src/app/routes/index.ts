import express from 'express';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { UserRoute } from '../modules/user/user.routes';
import { CalendarRoutes } from '../modules/calendar/calendar.routes';

const router = express.Router();

type Route = { path: string; route: express.Router };

const routes: Route[] = [
  { path: '/auth', route: AuthRoutes },
  { path: '/users', route: UserRoute },
  { path: '/calendars', route: CalendarRoutes },
];

routes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
