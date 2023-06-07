import jwtDecode from 'jwt-decode'
import url from 'url'
import { deletePassword, getPassword, setPassword } from 'keytar'
import os from 'os'
import { post } from 'main/util';

const {domain, clientId} = window.electron.auth.getConfig();

const redirectUri = 'http://localhost/callback';

const keytarService = 'electron-openid-oauth';
const keytarAccount = os.userInfo().username;

let accessToken: string | null = null;
let profile: any = null;
let refreshToken: string | null = null;

export function getAccessToken() {
  return accessToken;
}

export function getProfile() {
  return profile;
}

export function getAuthenticationURL() {
  return (
    "https://" +
    domain +
    "/authorize?" +
    "scope=openid profile offline_access&" +
    "response_type=code&" +
    "client_id=" +
    clientId +
    "&" +
    "redirect_uri=" +
    redirectUri
  );
}

export async function refreshTokens() {
  const refreshToken = await getPassword(keytarService, keytarAccount);

  if (refreshToken) {
    const refreshOptions = {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: {
        grant_type: 'refresh_token',
        client_id: clientId,
        refresh_token: refreshToken,
      }
    };
    try {
      const response = await post(`https://${domain}`, 'oauth/token', refreshOptions);
      const resJson = await response.json();
      accessToken = resJson.access_token;
      profile = jwtDecode(resJson.id_token);
    } catch (error) {
      await logout();

      throw error;
    }
  } else {
    throw new Error("No available refresh token.");
  }
}

export async function loadTokens(callbackURL: string) {
  const urlParts = url.parse(callbackURL, true);
  const query = urlParts.query;

  const exchangeOptions = {
    'grant_type': 'authorization_code',
    'client_id': clientId,
    'code': query.code,
    'redirect_uri': redirectUri,
  };

  const options = {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    data: JSON.stringify(exchangeOptions),
  };

  try {
    const response = await post(`https://${domain}`, 'oauth/token', options);
    const resJson = await response.json();
    accessToken = resJson.access_token;
    profile = jwtDecode(resJson.id_token);
    refreshToken = resJson.refresh_token;

    if (refreshToken) {
      await setPassword(keytarService, keytarAccount, refreshToken);
    }
  } catch (error) {
    await logout();

    throw error;
  }
}

export async function logout() {
  await deletePassword(keytarService, keytarAccount);
  accessToken = null;
  profile = null;
  refreshToken = null;
}

export function getLogOutUrl() {
  return `https://${domain}/v2/logout`;
}
