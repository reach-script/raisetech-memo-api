import { json } from 'micro';
import { get, post, del, router, put } from 'microrouter';
import { internalServerError, unAuthorizedError } from '../error';
import { client } from '../libs/db/client';
import { jwtAuth } from '../utils';
import { validate } from '../utils/validation';

const INVALID_ID = 'IDが不正です';

export default router(
  get(
    '/memos',
    jwtAuth(async (req) => {
      const { id } = req.jwt;
      if (!id) {
        return unAuthorizedError();
      }
      const { data: memos, error } = await client
        .from('memo')
        .select('id,title,category,description,date,mark_div')
        .eq('user_id', id);
      if (error) {
        console.log(error);
        throw internalServerError(error.message);
      }

      return memos;
    }),
  ),
  post(
    '/memo',
    jwtAuth(async (req) => {
      try {
        const { id } = req.jwt;
        const memo = await json(req);
        const valid = validate(memo);
        if (!valid) {
          const message = validate.errors.map((item) => item.message);
          return { message };
        }

        const { data, error } = await client.from('memo').insert([{ user_id: id, ...memo }]);
        if (error) {
          console.info('error', error);
          throw internalServerError(error.message);
        }
        if (data.length == 0) {
          throw internalServerError();
        }

        const insertedMemo = data[0];
        delete insertedMemo.user_id;

        return { ...insertedMemo };
      } catch (error) {
        throw internalServerError(error.message);
      }
    }),
  ),
  put(
    '/memo/:id',
    jwtAuth(async (req) => {
      const { id } = req.params;
      const { id: userId } = req.jwt;

      const message: Array<string> = [];
      if (!id) {
        message.push(INVALID_ID);
      }
      const memo = await json(req);
      const valid = validate(memo);
      if (!valid) {
        message.push(...validate.errors.map((item) => item.message));
      }

      if (message.length > 0) {
        return { message };
      }

      const { data, error } = await client.from('memo').update(memo).eq('id', id).eq('user_id', userId);
      console.info(data, error);

      if (error) {
        throw internalServerError();
      }
      if (data.length === 0) {
        throw internalServerError();
      }

      const updatedMemo = data[0];
      delete updatedMemo.user_id;

      return updatedMemo;
    }),
  ),
  del(
    '/memo/:id',
    jwtAuth(async (req) => {
      const { id } = req.params;
      const { id: userId } = req.jwt;
      if (!id) {
        return { message: [INVALID_ID] };
      }

      const { data, error } = await client.from('memo').delete().eq('id', id).eq('user_id', userId);

      if (error) {
        throw internalServerError();
      }
      if (data.length === 0) {
        throw internalServerError();
      }

      const deletedMemo = data[0];
      delete deletedMemo.user_id;
      return deletedMemo;
    }),
  ),
);
