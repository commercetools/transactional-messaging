import { Router } from 'express';
import { post } from '../controllers/event.controller';

const eventRouter: Router = Router();

eventRouter.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

eventRouter.post('/', post);

export default eventRouter;
