// m stands for method

import { hyperApi } from '../setup.js';
import e_func from './e.js';

export default hyperApi
	.module()
	.use(/* valibot */)
	.action((request) => {
        return [
            { method: 'sendMessage', params: [123, 'hello', { reply_markup: 'HTML' }]};
        ]
    });
