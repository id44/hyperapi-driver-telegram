import { HyperAPI, HyperAPIInvalidParametersError } from '@hyperapi/core';
import type { HyperAPIRequest } from '@hyperapi/core/dev';
import * as v from 'valibot';
import { HyperAPITelegramDriver } from '../src/main.js';

const ROOT = new URL('hyper-api', import.meta.url).pathname;

const env = v.parse(
	v.object({
		TG_DRIVER_TEST_TELEGRAM_BOT_TOKEN: v.pipe(v.string(), v.minLength(1)),
	}),
	process.env,
);

export const hyperApi = new HyperAPI(
	new HyperAPITelegramDriver({
		telegram_bot_token: env.TG_DRIVER_TEST_TELEGRAM_BOT_TOKEN,
	}),
	ROOT,
);
