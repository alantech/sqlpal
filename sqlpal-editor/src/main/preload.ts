// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import run from './run';
import { post, prepareBody, Schema, } from './util';
import validate from './validate';
import { SQLDialect } from 'sql-surveyor';

export type Channels = 'ipc-example';

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
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
  db: {
    run: async (
      connString: string,
      sql: string,
      dialect: string,
    ) => {
      return await run(connString, sql, dialect);
    },
  },
  server: {
    autocomplete: async (
      backendUrl: string,
      connString: string,
      sql: string,
      dialect: string,
    ) => {
      const endpoint = 'autocomplete';
      const body = await prepareBody(endpoint, { query: sql, conn_str: connString, dialect });
      console.log('body prepared', body)
      const signal = abortIfNecessaryAndReturnSignal(endpoint);
      const resp = await post(
        backendUrl,
        endpoint,
        body,
        false,
        signal,
      );
      return resp.json();
    },
    discover: async (
      backendUrl: string,
      connString: string,
      dialect: string,
      schema: Schema,
    ) => {
      const endpoint = 'discover';
      const body = await prepareBody(endpoint, { conn_str: connString, dialect, schema });
      const resp = await post(backendUrl, endpoint, body);
      return resp.json();
    },
    repair: async (
      backendUrl: string,
      connString: string,
      query: string,
      error: string,
      dialect: string,
    ) => {
      const endpoint = 'repair';
      const body = await prepareBody(endpoint, {
        conn_str: connString,
        query: query,
        error_message: error,
        dialect,
      });
      const signal = abortIfNecessaryAndReturnSignal(endpoint);
      const resp = await post(
        backendUrl,
        endpoint,
        body,
        false,
        signal,
      );
      return resp.json();
    },
    add: async (
      backendUrl: string,
      connString: string,
      query: string,
      dialect: string,
    ) => {
      const endpoint = 'add';
      const body = await prepareBody(endpoint, { query, conn_str: connString, dialect });
      const resp = await post(backendUrl, endpoint, body);
      return resp.json();
    },
  },
  editor: {
    validate: async (
      content: string,
      schema: Schema,
      dialect: string,
    ) => {
      return await validate(content, schema, dialect as keyof typeof SQLDialect);
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
