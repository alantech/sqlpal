import { execSync, } from 'child_process'

import { createConnection, } from 'typeorm'

import * as iasql from '../src/services/iasql'

export function execComposeUp() {
  execSync('cd test && docker-compose up -d && sleep 5');
}

export function execComposeDown() {
  execSync('cd test && docker-compose down');
}

export function getPrefix(){
  const lowerCaseLetters = Array(26).fill('a').map((c, i) => String.fromCharCode(c.charCodeAt() + i));
  const digits = Array(10).fill('0').map((c, i) => String.fromCharCode(c.charCodeAt() + i));
  const chars = [ lowerCaseLetters, digits, ].flat();
  const randChar = (): string => chars[Math.floor(Math.random() * chars.length)];
  const randLetter = (): string => lowerCaseLetters[Math.floor(Math.random() * lowerCaseLetters.length)];
  return randLetter() + Array(6).fill('').map(() => randChar()).join('');
}

export function finish(done: (e?: any) => {}) {
  return [() => done(), (e: any) => { done(e); }];
}

export function runApply(dbAlias: string, done: (e?: any) => {}) {
  iasql.apply(dbAlias, false, 'not-needed').then(...finish(done));
}

export function runSync(dbAlias: string, done: (e?: any) => {}) {
  iasql.sync(dbAlias, false, 'not-needed').then(...finish(done));
}

export function runQuery(dbAlias: string, queryString: string, assertFn?: (res: any[]) => void) {
  return function (done: (e?: any) => {}) {
    console.log(queryString);
    createConnection({
      name: dbAlias,
      type: 'postgres',
      username: 'postgres',
      password: 'test',
      host: 'localhost',
      port: 5432,
      database: dbAlias,
      extra: { ssl: false, },
    }).then((conn) => {
      conn.query(queryString).then((res: any[]) => {
        conn.close().then(...finish((_e?: any) => {
          if (assertFn) {
            try {
              assertFn(res);
            } catch (e: any) {
              done(e);
              return {};
            }
          }
          done();
          return {};
        }));
      }, (e) => {
        conn.close().then(() => done(e), (e2) => done(e2));
      });
    }, done);
  }
}