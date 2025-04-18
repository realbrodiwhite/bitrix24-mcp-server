import { config } from 'dotenv';

config();

const {
  BITRIX24_DOMAIN,
  BITRIX24_USER_ID,
  BITRIX24_WEBHOOK_TOKEN,
  BITRIX24_ZONE = 'com',
  SERVER_NAME = 'bitrix24-mcp-server',
  SERVER_VERSION = '0.1.0',
  API_TIMEOUT = '5000',
} = process.env;

if (!BITRIX24_DOMAIN) {
  throw new Error('Missing BITRIX24_DOMAIN environment variable');
}
if (!BITRIX24_USER_ID) {
  throw new Error('Missing BITRIX24_USER_ID environment variable');
}
if (!BITRIX24_WEBHOOK_TOKEN) {
  throw new Error('Missing BITRIX24_WEBHOOK_TOKEN environment variable');
}

export const configEnv = {
  BITRIX24_DOMAIN,
  BITRIX24_USER_ID,
  BITRIX24_WEBHOOK_TOKEN,
  BITRIX24_ZONE,
  SERVER_NAME,
  SERVER_VERSION,
  API_TIMEOUT: Number(API_TIMEOUT),
};
