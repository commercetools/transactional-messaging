import 'dotenv/config';
import { createApiRoot } from '../client/create.client';
import { normaliseServiceUrl, saveServiceUrl } from './service-url';

async function run(): Promise<void> {
  try {
    const url = normaliseServiceUrl(process.env.CONNECT_SERVICE_URL);
    await saveServiceUrl(createApiRoot(), url);
    process.stdout.write(
      'Template API address saved for the Merchant Center.\n'
    );
  } catch (error) {
    // Print only the message: error objects can carry request details.
    process.stderr.write(`Post-deploy failed: ${(error as Error).message}\n`);
    process.exitCode = 1;
  }
}

void run();
