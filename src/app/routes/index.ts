import express from 'express';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { UserRoute } from '../modules/user/user.routes';
import { CalendarRoutes } from '../modules/calendar/calendar.routes';
import { ClientRoutes } from '../modules/client/client.routes';
import { PublicCalendarRoutes } from '../modules/publicCalendar/publicCalendar.routes';

const router = express.Router();

type Route = { path: string; route: express.Router };

const routes: Route[] = [
  { path: '/auth', route: AuthRoutes },
  { path: '/users', route: UserRoute },
  { path: '/calendars', route: CalendarRoutes },
  { path: '/clients', route: ClientRoutes },
  { path: '/public-calenders', route: PublicCalendarRoutes },
];

routes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
