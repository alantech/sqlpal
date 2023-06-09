import jwtDecode from 'jwt-decode'
import url from 'url'
import keytar from 'keytar'
import os from 'os'
import { post } from './util'
import { createHash, randomBytes } from 'crypto'
import { app } from 'electron'

const auth0Domain = 'sqlpal.us.auth0.com'
const apiIdentifier = 'https://api.sqlpal.ai'
const clientId = 'gFqVK6oPKmfGrir2j3YbLMHiROSgkSuV'
// const redirectUri = app.isPackaged ? 'file:///callback' : 'http://localhost/callback'
const redirectUri = 'http://localhost/callback'
const verifier = base64URLEncode(randomBytes(32));

// const redirectUri = `file:///callback`
// const redirectUri = `sqlpal:///callback`
// const scope = 'openid profile offline_access',
// const audience: 'https://api.sqlpal.ai',
// const responseType = 'code';
// scope = 'read:current_user'


const keytarService = 'sqlpal'
const keytarAccount = os.userInfo().username

let accessToken: string | null = null
let profile: string | null = null
let refreshToken: string | null = null

function getAccessToken () {
  return accessToken
}

function getProfile () {
  return profile
}

// Dependency: Node.js crypto module
// https://nodejs.org/api/crypto.html#crypto_crypto
function base64URLEncode(buffer: Buffer) {
  return buffer.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
}

// Dependency: Node.js crypto module
// https://nodejs.org/api/crypto.html#crypto_crypto
function sha256(buffer: Buffer): Buffer {
  return createHash('sha256').update(buffer).digest();
}

function getAuthenticationURL () {
  console.log(`getAuthenticationURL verifier: ${verifier}`)
  const codeChallenge = base64URLEncode(sha256(Buffer.from(verifier)));
  console.log(`codeChallenge: ${codeChallenge}`)
  return (
    'https://' +
    auth0Domain +
    '/authorize?' +
    'audience=' +
    encodeURI(apiIdentifier) +
    '&' +
    // 'scope=openid profile offline_access&' +
    `scope=${encodeURI('openid name email nickname')}&` +
    'response_type=code&' +
    'client_id=' +
    encodeURI(clientId) +
    '&' +
    'redirect_uri=' +
    encodeURI(redirectUri)
    // '&' +
    // 'code_challenge=' + 
    // encodeURI(codeChallenge) +
    // '&' +
    // 'code_challenge_method=S256'
  )

}

async function refreshTokens () {
    const refreshToken = await keytar.getPassword(keytarService, keytarAccount)

    if (!refreshToken) throw new Error('no refresh token available')

    const refreshBody = {
      grant_type: 'refresh_token',
      client_id: clientId,
      refresh_token: refreshToken
    }

    const res = await post(`https://${auth0Domain}`, 'oauth/token', refreshBody);
    const body = await res.json();
    accessToken = body.access_token
    profile = jwtDecode(body.id_token)
    // global.accessToken = accessToken
}

async function loadTokens(callbackURL: string) {
    console.log(`loadTokens verifier: ${verifier}`)
    const urlParts = url.parse(callbackURL, true)
    console.log('urlParts: ', urlParts)
    const query = urlParts.query
    console.log('+-+ load tokens query: ', query)
    const exchangeOptions = {
      grant_type: 'authorization_code',
      client_id: clientId,
      code_verifier: verifier,
      code: query.code,
      redirect_uri: redirectUri
    }
    console.log(` exchangeOptions: ${JSON.stringify(exchangeOptions)}`)
    // const options = {
    //   method: 'POST',
    //   // url: `https://${auth0Domain}/oauth/token`,
    //   headers: {
    //     'content-type': 'application/json'
    //   },
    //   body: JSON.stringify(exchangeOptions)
    // }

    let res: any;
    try {
      console.log(`https://${auth0Domain}`)
      res = await post(`https://${auth0Domain}`, 'oauth/token', exchangeOptions);
    } catch (err) {
      console.log(`erroor on post`)
      console.log(err)
      throw err;
    }
    try {
      const body = await res.json();
      console.log(`body: ${JSON.stringify(body)}`)
      // const responseBody = JSON.parse(body)
      accessToken = body.access_token
      // global.accessToken = accessToken
      profile = jwtDecode(body.id_token)
      refreshToken = body.refresh_token
      if (refreshToken) {
        await keytar.setPassword(keytarService, keytarAccount, refreshToken);
      }
    } catch (err) {
      console.log(`erroor on body`)
      console.log(err)
      throw err;
    }

}

async function logout () {
  await keytar.deletePassword(keytarService, keytarAccount)
  accessToken = null
  profile = null
  refreshToken = null
}

function getLogOutUrl() {
  return `https://${auth0Domain}/v2/logout`;
}

export default {
  getAccessToken,
  getAuthenticationURL,
  getProfile,
  loadTokens,
  logout,
  refreshTokens,
  getLogOutUrl,
}