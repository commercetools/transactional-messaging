import 'dotenv/config';
import { createApiRoot } from '../client/create.client';
import { deleteSubscription } from './subscription';

async function run(): Promise<void> {
  try {
    const removed = await deleteSubscription(createApiRoot());
    process.stdout.write(removed ? 'Subscription removed.\n' : 'No subscription to remove.\n');
  } catch (error) {
    process.stderr.write(`Pre-undeploy failed: ${(error as Error).message}\n`);
    process.exitCode = 1;
  }
}

void run();
