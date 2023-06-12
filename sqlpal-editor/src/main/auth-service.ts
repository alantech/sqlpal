import jwtDecode from 'jwt-decode';
import url from 'url';
import keytar from 'keytar';
import os from 'os';
import { post } from './util';
import { randomBytes } from 'crypto';
import config from './config';

const verifier = base64URLEncode(randomBytes(32));
const environment =
  process.env.NODE_ENV === 'production' ? 'prod' : 'local' || 'local';
const keytarService = 'sqlpal';
const keytarAccount = os.userInfo().username;
const { domain, clientId } = config[environment]?.auth ?? {
  domain: '',
  clientId: '',
};
const {
  audience,
  redirect_uri: redirectUri,
  response_type: responseType,
  scope,
} = config[environment]?.auth?.authorizationParams ?? {
  audience: '',
  redirect_uri: '',
  response_type: '',
  scope: '',
};

let accessToken: string | null = null;
let profile: string | null = null;
let refreshToken: string | null = null;

function getAccessToken() {
  return accessToken;
}

function getProfile() {
  return profile;
}

// Dependency: Node.js crypto module
// https://nodejs.org/api/crypto.html#crypto_crypto
function base64URLEncode(buffer: Buffer) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// // Dependency: Node.js crypto module
// // https://nodejs.org/api/crypto.html#crypto_crypto
// function sha256(buffer: Buffer): Buffer {
//   return createHash('sha256').update(buffer).digest();
// }

function getAuthenticationURL() {
  return (
    'https://' +
    domain +
    '/authorize?' +
    `audience=${encodeURI(audience)}&` +
    `scope=${encodeURI(scope)}&` +
    `response_type=${encodeURI(responseType ?? 'code')}&` +
    `client_id=${encodeURI(clientId)}&` +
    `redirect_uri=${encodeURI(redirectUri)}`
  );
}

async function refreshTokens() {
  const refreshToken = await keytar.getPassword(keytarService, keytarAccount);

  if (!refreshToken) throw new Error('no refresh token available');

  const refreshBody = {
    grant_type: 'refresh_token',
    client_id: clientId,
    refresh_token: refreshToken,
  };

  const res = await post(`https://${domain}`, 'oauth/token', refreshBody);
  const body = await res.json();
  accessToken = body.access_token;
  profile = jwtDecode(body.id_token);
}

async function loadTokens(callbackURL: string) {
  const urlParts = url.parse(callbackURL, true);
  const query = urlParts.query;
  const exchangeOptions = {
    grant_type: 'authorization_code',
    client_id: clientId,
    code_verifier: verifier,
    code: query.code,
    redirect_uri: redirectUri,
  };
  let res: any;
  try {
    res = await post(`https://${domain}`, 'oauth/token', exchangeOptions);
  } catch (err) {
    throw err;
  }
  try {
    const body = await res.json();
    accessToken = body.access_token;
    profile = jwtDecode(body.id_token);
    refreshToken = body.refresh_token;
    if (refreshToken) {
      await keytar.setPassword(keytarService, keytarAccount, refreshToken);
    }
  } catch (err) {
    console.log(`erroor on body`);
    console.log(err);
    throw err;
  }
}

async function logout() {
  await keytar.deletePassword(keytarService, keytarAccount);
  accessToken = null;
  profile = null;
  refreshToken = null;
}

function getLogOutUrl() {
  return `https://${domain}/v2/logout`;
}

export default {
  getAccessToken,
  getAuthenticationURL,
  getProfile,
  loadTokens,
  logout,
  refreshTokens,
  getLogOutUrl,
};
