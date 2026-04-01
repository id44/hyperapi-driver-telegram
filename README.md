# HyperAPI Telegram Driver

HyperAPI driver for Telegram bots.

This driver connects your HyperAPI application to Telegram using the `node-telegram-bot-api` library, offering an elegant, file-routed approach to building [Telegram bots](https://core.telegram.org/bots).

## Features
*  🤖  **Native Telegram Support**  - Seamlessly process messages and callback queries.
*  🔄  **Smart Command Routing**  - Automatically maps Telegram commands to predictable file routes (e.g., `/commands/start`).
*  🗺  **Path Mapping**  - Built-in `path_map` mechanism to map short strings to your actual endpoints.
*  🧩  **Comprehensive Typing**  - Full TypeScript support with HyperAPI Core.

> [!NOTE]
> This driver is currently in active development. At present, it only processes two types of Telegram updates: `message` and `callback_query`. If you need support for other update types, feel free to open an issue with a brief proposal on how they should be handled. Alternatively, you can process them manually by attaching an `.on()` event listener directly to your `TelegramBot` instance.

## Installation

```bash
bun i @hyperapi/core node-telegram-bot-api
bun add @hyperapi/driver-telegram@github:id44/hyperapi-driver-telegram#04ae84ab3ffba27c45d3fba114fde1f4a0a5ff8a
```

## Quick Start

### 1. Initialize your Bot and Driver

```js
import { HyperAPI } from '@hyperapi/core';
import { HyperAPITelegramDriver } from '@hyperapi/driver-telegram';
import TelegramBot from 'node-telegram-bot-api';

const bot = new TelegramBot('YOUR_TELEGRAM_BOT_TOKEN', { polling: true });

const driver = new HyperAPITelegramDriver({
    telegram_client: bot,
    // Optional: map short callback prefixes to full paths
    path_map: { 
        'c': 'create',
        'd': 'delete' 
    }
});

export const hyperApi = new HyperAPI(
    driver,
    // Optional: custom root path for API methods (default: 'hyper-api' in project root)
    // path.join(import.meta.dir, 'api')
);
```

### 2. Create your API handlers

Example command handler (`hyper-api/commands/start.ts`):

```js
import { hyperApi } from '../main.js';

export default hyperApi.module().action(async (request) => {
    // You can access the node-telegram-bot-api instance directly from the request
    await request.bot.sendMessage(
        request.chat.id, 
        `Hello, ${request.from?.first_name}! Welcome to the bot.`
    );
});
```

## Request Properties

The `HyperAPITelegramRequest` interface extends the base `HyperAPIRequest` from [HyperAPI Core](https://github.com/hyperapi/core) and adds Telegram-specific properties:

```js
import type TelegramBot from 'node-telegram-bot-api';

type TelegramUpdateData =
	| {
        type: 'message';
        message: TelegramBot.Message;
        query?: never
    }
	| {
        type: 'callback_query';
        query: TelegramBot.CallbackQuery;
        message?: never;
    };

interface HyperAPITelegramRequest<A extends Record<string, unknown>> extends HyperAPIRequest<A> {
	telegram_update: TelegramUpdateData;
	bot: TelegramBot;
	chat: TelegramBot.Chat;
	from?: TelegramBot.User;
}
```

## Smart Routing

The driver automatically analyzes incoming Telegram updates and routes them to specific paths in your HyperAPI file tree:

```
my-project/
├── hyper-api/
│   ├── messages.ts
│   └── commands/
│       ├── start.ts
│       └── settings.ts
│   └── test/
│       ├── some-long-named-action.[id].ts
├── index.ts
└── package.json
```

### 1. Commands:

Messages starting with `/start` are automatically routed to `/commands/start.ts`. If the command includes a payload, it is extracted and passed via `request.args.payload`. For all other commands, the text following the command itself is available in `request.args.content`.

### 2. Standard Messages:

Any text or caption that does not contain a command is routed to the `/messages` path.

### 3. Callback Queries:

Routed directly to the path specified in their payload, which can be parsed as a URL with query parameters.

#### Data Mapping (Path Map)

If you want to keep your callback_data payloads short, you can pass a `path_map` object to the driver configuration:

```js
// For example, if you define path_map this way:

{
  // ...other driver options
  path_map: {
    s: 'some-long-named-action',
    t: 'test',
  }
}

// a callback query containing /t/s/1 will be automatically decoded
// and routed to your /test/some-long-named-action.[id].ts handler.
```

## Contributing

Issues and pull requests are welcome at [this GitHub repository](https://github.com/id44/hyperapi-driver-telegram).
