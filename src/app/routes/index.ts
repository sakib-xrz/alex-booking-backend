import express from 'express';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { UserRoutes } from '../modules/user/user.routes';
import { CalendarRoutes } from '../modules/calendar/calendar.routes';
import { ClientRoutes } from '../modules/client/client.routes';
import { AppointmentRoutes } from '../modules/appointment/appointment.routes';
import { PublicCalendarRoutes } from '../modules/publicCalendar/publicCalendar.routes';
import { PublicAppointmentRoutes } from '../modules/publicAppointment/publicAppointment.routes';
import { OptVerificationRoutes } from '../modules/optVerification/optVerification.routes';
import { PaymentRoutes } from '../modules/payment/payment.routes';
import { GoogleRoutes } from '../modules/google/google.routes';

const router = express.Router();

type Route = { path: string; route: express.Router };

const routes: Route[] = [
  { path: '/auth', route: AuthRoutes },
  { path: '/users', route: UserRoutes },
  { path: '/calendars', route: CalendarRoutes },
  { path: '/clients', route: ClientRoutes },
  { path: '/appointments', route: AppointmentRoutes },
  { path: '/public-calenders', route: PublicCalendarRoutes },
  { path: '/public-appointments', route: PublicAppointmentRoutes },
  { path: '/otp', route: OptVerificationRoutes },
  { path: '/payments', route: PaymentRoutes },
  { path: '/google', route: GoogleRoutes },
];

routes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
