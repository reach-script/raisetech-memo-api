import { createError, json } from 'micro';
import { router, get, post } from 'microrouter';
import microCors from 'micro-cors';
import { client } from './libs/db/client';
import { sign, verify } from 'jsonwebtoken';
import jwtAuth from 'micro-jwt-auth';
import dotenv from 'dotenv';

dotenv.config();
const cors = microCors();
const JWT_SECRET = process.env.JWT_SECRET;

export = cors(
  router(
    get('/memos', async (req) => {
      const payload = getPayload(req);
      if (payload === null) {
        return unAuthorizedError();
      }
      const { id } = payload;
      const { data: memos, error } = await client.from('memo').select('*').eq('user_id', id);
      if (error) {
        console.log(error);
        throw internalServerError(error.message);
      }
      return memos;
    }),
    post('/me', async (req, res) => {
      // not work
      return me(req, res);
    }),
    post('/login', async (req) => {
      const data = await json(req);
      const { email, password } = data;

      // TODO パスワードの暗号化とかセキュアな方法調査(?)
      const { data: users } = await client.from('user').select('*').eq('email', email);

      if (users.length === 0) {
        return unAuthorizedError();
      }
      const user = users[0];

      if (user.password !== password) {
        return unAuthorizedError();
      }

      const token = sign({ id: user.id }, JWT_SECRET, {
        expiresIn: `${process.env.TOKEN_EXPIRED_HOUR}h`,
      });

      return { access_token: token };
    }),
  ),
);

const unAuthorizedError = () => ({ message: 'unauthorized' });
const internalServerError = (message?: string) => {
  const error = new Error('panic!');
  const httpError = createError(500, message || 'internal server error.', error);
  return httpError;
};

const me = jwtAuth(JWT_SECRET)(async (req) => {
  return req.jwt.user;
});

const getPayload = (req) => {
  const authHeader = req.headers['authorization'];
  if (authHeader === undefined) return null;

  const [tokenType, token] = authHeader.split(' ');

  if (tokenType !== 'Bearer') return null;
  try {
    const payload = verify(token, JWT_SECRET);
    if (typeof payload === 'string') return null;

    return payload;
    // if (payload.username === 'hoge') {
    // } else {
    //   return null;
    // }
  } catch {
    return null;
  }
};
