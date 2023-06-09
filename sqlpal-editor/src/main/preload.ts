// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer } from 'electron';
import run from './run';
import { post, prepareBody, Schema } from './util';
import validate from './validate';
import { SQLDialect } from 'sql-surveyor';

// Todo: handle this better
const signalController = new Map<'autocomplete' | 'repair', AbortController>();

const abortIfNecessaryAndReturnSignal = (key: 'autocomplete' | 'repair') => {
  const controller = signalController.get(key);
  if (controller) {
    controller.abort();
  }
  signalController.set(key, new AbortController());
  return signalController.get(key)!.signal;
};

const electronHandler = {
  config: {
    get() {
      return {
        sqlpalEnv: process.env.NODE_ENV === 'production' ? 'prod' : 'local',
        uid: 'uid',
        telemetry: process.env.NODE_ENV === 'production' ? 'on' : 'off',
      };
    },
  },
  db: {
    run: async (connString: string, sql: string, dialect: string) => {
      return await run(connString, sql, dialect);
    },
  },
  server: {
    autocomplete: async (
      backendUrl: string,
      connString: string,
      sql: string,
      dialect: string
    ) => {
      const endpoint = 'autocomplete';
      const body = await prepareBody(endpoint, {
        query: sql,
        conn_str: connString,
        dialect,
      });
      const signal = abortIfNecessaryAndReturnSignal(endpoint);
      const resp = await post(backendUrl, endpoint, body, false, signal);
      return resp.json();
    },
    discover: async (
      backendUrl: string,
      connString: string,
      dialect: string,
      schema: Schema
    ) => {
      const endpoint = 'discover';
      const body = await prepareBody(endpoint, {
        conn_str: connString,
        dialect,
        schema,
      });
      const resp = await post(backendUrl, endpoint, body);
      return resp.json();
    },
    repair: async (
      backendUrl: string,
      connString: string,
      query: string,
      error: string,
      dialect: string
    ) => {
      const endpoint = 'repair';
      const body = await prepareBody(endpoint, {
        conn_str: connString,
        query: query,
        error_message: error,
        dialect,
      });
      const signal = abortIfNecessaryAndReturnSignal(endpoint);
      const resp = await post(backendUrl, endpoint, body, false, signal);
      return resp.json();
    },
    add: async (
      backendUrl: string,
      connString: string,
      query: string,
      dialect: string
    ) => {
      const endpoint = 'add';
      const body = await prepareBody(endpoint, {
        query,
        conn_str: connString,
        dialect,
      });
      const resp = await post(backendUrl, endpoint, body);
      return resp.json();
    },
  },
  editor: {
    validate: async (content: string, schema: Schema, dialect: string) => {
      return await validate(
        content,
        schema,
        dialect as keyof typeof SQLDialect
      );
    },
  },
  auth: {
    getProfile: () => ipcRenderer.invoke('auth:get-profile'),
    logOut: () => ipcRenderer.send('auth:log-out'),
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
