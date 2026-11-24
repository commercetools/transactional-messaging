import 'dotenv/config';
import { logger } from './utils/logger.utils';
import { readChannelConfiguration, readConfiguration } from './utils/config.utils';
import app from './app';

// Fail fast on missing or invalid configuration before accepting traffic.
readConfiguration();
readChannelConfiguration();

// Connect runs event applications on port 8080.
const PORT = 8080;

const server = app.listen(PORT, () => {
  logger.info(`Notification sender listening on port ${PORT}`);
});

export default server;
