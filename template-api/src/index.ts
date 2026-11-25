import 'dotenv/config';
import { createApp } from './app';
import { readServiceConfiguration } from './config';
import { logger } from './utils/logger.utils';
import { createTemplateGateway } from './sendgrid/templates';

// Fail fast on missing or invalid configuration before accepting traffic.
const config = readServiceConfiguration();
const app = createApp(
  config,
  createTemplateGateway({
    apiKey: config.sendGridApiKey,
    dataResidency: config.dataResidency,
  })
);

// Connect runs service applications on port 8080. PORT only matters for local development.
const PORT = Number(process.env.PORT) || 8080;
const onListening = () => {
  logger.info(`Template API listening on port ${PORT}`);
  if (config.devMode) {
    logger.warn(
      'TEMPLATE_API_DEV_MODE is on: authentication is off and only this machine can connect.'
    );
  }
};
// Dev mode has no authentication, so it only listens on this machine.
const server = config.devMode
  ? app.listen(PORT, '127.0.0.1', onListening)
  : app.listen(PORT, onListening);

export default server;
