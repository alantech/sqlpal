import { Schema } from '../components/providers/AppProvider';

export async function run(connString: string, sql: string, dialect: string) {
  return await window.electron.db.run(connString, sql, dialect);
}

export async function autocomplete(
  backendUrl: string,
  connString: string,
  sql: string,
  dialect: string
) {
  return await window.electron.server.autocomplete(
    backendUrl,
    connString,
    sql,
    dialect
  );
}

export async function discoverData(
  backendUrl: string,
  connString: string,
  dialect: string,
  schema: Schema
) {
  // todo: fix cast
  return await window.electron.server.discover(
    backendUrl,
    connString,
    dialect,
    schema as any
  );
}

export async function repair(
  backendUrl: string,
  connString: string,
  query: string,
  error: string,
  dialect: string
) {
  return await window.electron.server.repair(
    backendUrl,
    connString,
    query,
    error,
    dialect
  );
}

export async function addStatement(
  backendUrl: string,
  connString: string,
  query: string,
  dialect: string
) {
  return await window.electron.server.add(
    backendUrl,
    connString,
    query,
    dialect
  );
}
