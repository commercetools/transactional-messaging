import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import EventRoutes from './routes/event.route';
import { errorMiddleware } from './middleware/error.middleware';
import CustomError from './errors/custom.error';

const app: Express = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

// The route must match the `endpoint` in connect.yaml.
app.use('/notificationSender', EventRoutes);

// Express 5 no longer accepts '*' as a path; a path-less middleware catches everything else.
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new CustomError(404, 'Path not found.'));
});

app.use(errorMiddleware);

export default app;
