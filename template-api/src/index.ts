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

// Connect runs service applications on port 8080.
const PORT = 8080;
const server = app.listen(PORT, () => {
  logger.info(`Template API listening on port ${PORT}`);
});

export default server;
