import { createError } from 'micro';

export const internalServerError = (message?: string): Error => {
  const error = new Error('panic!');
  const httpError = createError(500, message || 'internal server error.', error);
  return httpError;
};
