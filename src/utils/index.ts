import auth from 'micro-jwt-auth';
import dotenv from 'dotenv';
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

export const jwtAuth = auth(JWT_SECRET, {
  resAuthMissing: JSON.stringify({ message: 'unauthorized' }),
  resAuthInvalid: JSON.stringify({ message: 'unauthorized' }),
});
