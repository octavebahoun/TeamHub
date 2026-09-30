import axios from 'axios';
import { config } from './config.js';

export async function verifyToken(token) {
  const { data } = await axios.post(
    `${config.apiBaseUrl}/api/internal/verify`,
    { token },
    {
      headers: {
        'X-Internal-Secret': config.internalSecret,
        Accept: 'application/json',
      },
      timeout: 5000,
    },
  );
  return data;
}
