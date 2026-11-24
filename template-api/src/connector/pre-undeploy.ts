import 'dotenv/config';
import { createApiRoot } from '../client/create.client';
import { removeServiceUrl } from './service-url';

async function run(): Promise<void> {
  try {
    const removed = await removeServiceUrl(createApiRoot());
    process.stdout.write(
      removed ? 'Template API address removed.\n' : 'No address to remove.\n'
    );
  } catch (error) {
    process.stderr.write(`Pre-undeploy failed: ${(error as Error).message}\n`);
    process.exitCode = 1;
  }
}

void run();
