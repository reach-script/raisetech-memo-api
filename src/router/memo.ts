import { json, send } from 'micro';
import { get, post, del, router, put } from 'microrouter';
import { internalServerError } from '../error';
import { client } from '../libs/db/client';
import { jwtAuth } from '../utils';
import { validate } from '../utils/validation';

const INVALID_ID = 'IDが不正です';

export default router(
  get(
    '/api/memos',
    jwtAuth(async (req) => {
      const { id } = req.jwt;
      const { data: memos, error } = await client
        .from('memo')
        .select('id,title,category,description,date,mark_div')
        .eq('user_id', id);
      if (error) {
        console.log(error);
        throw internalServerError(error.message);
      }

      return memos.map((memo) => ({ ...memo, id: memo.id.toString() }));
    }),
  ),
  post(
    '/api/memo',
    jwtAuth(async (req, res) => {
      try {
        const { id } = req.jwt;
        const memo = await json(req);
        const valid = validate(memo);
        if (!valid) {
          const message = validate.errors.map((item) => item.message);
          send(res, 400, { message });
          return;
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

        return { ...insertedMemo, id: insertedMemo.id.toString() };
      } catch (error) {
        throw internalServerError(error.message);
      }
    }),
  ),
  put(
    '/api/memo/:id',
    jwtAuth(async (req, res) => {
      const { id } = req.params;
      const { id: userId } = req.jwt;

      const message: Array<string> = [];
      if (!id) {
        message.push(INVALID_ID);
      }

      const {
        data: [currentMemo],
        error: getError,
      } = await client
        .from('memo')
        .select('id,title,category,description,date,mark_div')
        .eq('user_id', userId)
        .eq('id', id);

      if (getError) {
        throw internalServerError();
      }

      if (!currentMemo) {
        send(res, 400, { message: 'IDが不正です' });
        return;
      }

      const memo = await json(req);
      const valid = validate(memo);
      if (!valid) {
        message.push(...validate.errors.map((item) => item.message));
      }

      if (message.length > 0) {
        send(res, 400, { message });
        return;
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

      return { ...updatedMemo, id: updatedMemo.id.toString() };
    }),
  ),
  del(
    '/api/memo/:id',
    jwtAuth(async (req, res) => {
      const { id } = req.params;
      const { id: userId } = req.jwt;
      if (!id) {
        return { message: [INVALID_ID] };
      }

      const {
        data: [currentMemo],
        error: getError,
      } = await client
        .from('memo')
        .select('id,title,category,description,date,mark_div')
        .eq('user_id', userId)
        .eq('id', id);

      if (getError) {
        throw internalServerError();
      }

      if (!currentMemo) {
        send(res, 400, { message: 'IDが不正です' });
        return;
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
      return { ...deletedMemo, id: deletedMemo.id.toString() };
    }),
  ),
);
