import { json } from 'micro';
import { post, router } from 'microrouter';
import { sign } from 'jsonwebtoken';
import { client } from '../libs/db/client';
import { unAuthorizedError } from '../error';
import dotenv from 'dotenv';
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

export default router(
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
  post('/logout', async () => {
    return { message: 'logout' };
  }),
);
