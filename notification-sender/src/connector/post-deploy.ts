import 'dotenv/config';
import { createApiRoot } from '../client/create.client';
import { buildDestination } from './destination';
import { ensureSubscription } from './subscription';
import { validateProviders } from './validate-providers';
import { readChannelConfiguration } from '../utils/config.utils';

async function run(): Promise<void> {
  try {
    // Fail the deployment when a configured channel cannot authenticate (plan §6.7).
    await validateProviders(readChannelConfiguration());
    const destination = buildDestination(process.env);
    const outcome = await ensureSubscription(createApiRoot(), destination);
    process.stdout.write(`Subscription ${outcome}.\n`);
  } catch (error) {
    // Print only the message: error objects can carry request details.
    process.stderr.write(`Post-deploy failed: ${(error as Error).message}\n`);
    process.exitCode = 1;
  }
}

void run();
