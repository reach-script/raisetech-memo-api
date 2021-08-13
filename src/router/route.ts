import { router } from 'microrouter';
import microCors from 'micro-cors';
import authRouter from './auth';
import memoRouter from './memo';

const cors = microCors();

export const route = cors(router(authRouter, memoRouter));
