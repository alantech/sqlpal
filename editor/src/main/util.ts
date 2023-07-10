/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import path from 'path';
import { SQLDialect } from 'sql-surveyor';
import { Knex, knex } from 'knex';

export enum KnexClient {
  MYSQL = 'mysql',
  TSQL = 'mssql',
  PLpgSQL = 'pg',
}

export function getDbClient(
  connectionString: string,
  dialect: keyof typeof SQLDialect,
): Knex<any, unknown[]> {
  const dbId = connectionString.split('/').pop()?.split('?')[0];
  const username = connectionString.split('/')[2].split(':')[0];
  const password = connectionString.split('/')[2].split(':')[1].split('@')[0];
  const host = connectionString.split('/')[2].split(':')[1].split('@')[1];
  const ssl = connectionString.includes('sslmode=require');
  return knex({
    client: KnexClient[dialect as keyof typeof KnexClient],
    connection: {
      database: dbId,
      user: username,
      password,
      host,
      ssl,
    },
  });
}

export type Schema = {
  [tableName: string]: { [columnName: string]: { dataType: string; isMandatory: boolean } } & {
    recordCount: number;
  };
};

export function resolveHtmlPath(htmlFileName: string) {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 3000;
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  }
  return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
}

async function maybeHandleFetchError(response: Response): Promise<void> {
  // TODO: What type here?
  if (!response.ok) {
    let message;
    try {
      message = await response.text();
    } catch (e) {
      message = `HTTP error code ${response.status}`;
    }
    try {
      const jsonEncodedError = JSON.parse(message).message;
      if (!!jsonEncodedError) message = jsonEncodedError;
    } catch (_) {
      // Nothing to do here
    }
    throw new Error(`Error: ${message}`);
  }
}

async function redirectIfUnauthorized(response: Response): Promise<void> {
  if (response.status === 403) {
    const obj = await response.json();
    if (obj.paymentLink) window.location.href = obj.paymentLink;
  }
}

export async function post(
  backendUrl: string,
  endpoint: string,
  body: any,
  raw = false,
  signal?: AbortSignal,
): Promise<Response> {
  try {
    const resp = await fetch(`${backendUrl}/${endpoint}`, {
      method: 'POST',
      signal,
      body: raw ? body : JSON.stringify(body),
      headers: {
        'Content-Type': raw ? 'text/plain' : 'application/json'
      },
    });
    await redirectIfUnauthorized(resp);
    await maybeHandleFetchError(resp);
    return resp;
  } catch (e: any) {
    console.error(e);
    if (e.name === 'AbortError') {
      // request was aborted
    }
    throw e;
  }
}

interface ServerCallRequestBody {
  conn_str: string;
  query?: string;
  schema?: Schema;
  dialect: keyof typeof SQLDialect | string;
  error_message?: string;
  tables_info?: { [tableName: string]: string };
}

export async function prepareBody(
  endpoint: string | string[] | undefined,
  body: ServerCallRequestBody,
): Promise<ServerCallRequestBody> {
  const bodyCopy = { ...body };
  if (endpoint && typeof endpoint === 'string' && endpoint === 'discover') {
    // Stablish db connection
    const client = getDbClient(body.conn_str, body.dialect as keyof typeof SQLDialect);
    // Generate table info for each table
    const tablesInfo: { [tableName: string]: string } = {};
    for (const [tableName, tableCols] of Object.entries(body.schema ?? {})) {
      tablesInfo[tableName] = await getTableInfo(client, tableName, tableCols, body.dialect as keyof typeof SQLDialect);
    }
    bodyCopy.tables_info = tablesInfo;
  }
  if (!!body.dialect) {
    bodyCopy.dialect = toServerDialect(body.dialect as keyof typeof SQLDialect);
  }
  return bodyCopy;
}

async function getTableInfo(
  knex: Knex,
  tableName: string,
  tableCols: {
    [columnName: string]: {
      dataType: string;
      isMandatory: boolean;
    };
  } & {
    recordCount: number;
  },
  dialect: keyof typeof SQLDialect,
): Promise<string> {
  let tableInfo = '';
  // add create table command
  const createTableStmt = await generateCreateTableStatement(knex, tableName, dialect);
  tableInfo += createTableStmt?.trimEnd() ?? '';
  tableInfo += '\n\n/*';
  // save the columns in string format
  const columnsStr = Object.keys(tableCols)
    .filter((c: string) => c !== 'recordCount')
    .join('\t');
  tableInfo += `\n${await getSampleRows(knex, tableName, columnsStr)}\n`;
  tableInfo += '*/';
  return tableInfo;
}

async function generateCreateTableStatement(
  knex: Knex,
  tableName: string,
  dialect: keyof typeof SQLDialect,
): Promise<string> {
  let createTableStatement = '';
  switch (dialect) {
    case 'MYSQL': {
      const res = await knex.raw(getMySQLCreateStatementQuery(tableName));
      const [result, _] = res;
      if (result.length) {
        createTableStatement = result[0]['Create Table'];
      }
      break;
    }
    case 'TSQL': {
      const res = await knex.raw(getMSSQLCreateStatementQuery(tableName));
      if (res.length) {
        createTableStatement = res[0].create_table;
      }
      break;
    }
    case 'PLpgSQL': {
      try {
        const res = await knex.raw(getPgCreateStatementQuery(tableName));
        if (res.rows.length) {
          createTableStatement = res.rows[0].create_table;
        }
      } catch (e) {
        console.error(e);
      }
      break;
    }
    default: {
      break;
    }
  }
  return createTableStatement;
}

async function getSampleRows(knex: Knex, tableName: string, columnsStr: string): Promise<string> {
  const sampleRowsNumber = 3;
  let sampleRows = await knex(tableName).select('*').limit(sampleRowsNumber);
  // convert the sample rows to string format only containing the values
  sampleRows = sampleRows.map((sr: any) => Object.values(sr).join(' '));
  // shorten values in the sample rows
  sampleRows = sampleRows.map((sr: string) => sr.slice(0, 100));
  // save the sample rows in string format
  const sampleRowsStr = sampleRows.join(' \n');
  return `${sampleRowsNumber} rows from ${tableName} table:
${columnsStr}
${sampleRowsStr}`;
}

// From: https://stackoverflow.com/a/60749494
function getPgCreateStatementQuery(tableName: string): string {
  return `
SELECT 'CREATE TABLE ' || pc.relname || E'(\n' ||
  string_agg(pa.attname || ' ' || pg_catalog.format_type(pa.atttypid, pa.atttypmod) || coalesce(' DEFAULT ' || (
                                                                                                              SELECT pg_catalog.pg_get_expr(d.adbin, d.adrelid)
                                                                                                              FROM pg_catalog.pg_attrdef d
                                                                                                              WHERE d.adrelid = pa.attrelid
                                                                                                                AND d.adnum = pa.attnum
                                                                                                                AND pa.atthasdef
                                                                                                              ),
                                                                                                '') || ' ' ||
             CASE pa.attnotnull
                 WHEN TRUE THEN 'NOT NULL'
                 ELSE 'NULL'
             END, E',\n') ||
  coalesce((SELECT E',\n' || string_agg('CONSTRAINT ' || pc1.conname || ' ' || pg_get_constraintdef(pc1.oid), E',\n' ORDER BY pc1.conindid)
           FROM pg_constraint pc1
           WHERE pc1.conrelid = pa.attrelid), '') ||
  E');' AS create_table
FROM pg_catalog.pg_attribute pa
JOIN pg_catalog.pg_class pc
   ON pc.oid = pa.attrelid
   AND pc.relname = '${tableName}'
JOIN pg_catalog.pg_namespace pn
   ON pn.oid = pc.relnamespace
   AND pn.nspname = 'public'
WHERE pa.attnum > 0
   AND NOT pa.attisdropped
GROUP BY pn.nspname, pc.relname, pa.attrelid;
`;
}

function getMySQLCreateStatementQuery(tableName: string): string {
  return `SHOW CREATE TABLE ${tableName};`;
}

// From: https://www.c-sharpcorner.com/UploadFile/67b45a/how-to-generate-a-create-table-script-for-an-existing-table/
function getMSSQLCreateStatementQuery(tableName: string): string {
  return `
  DECLARE
  @object_name SYSNAME
, @object_id INT
, @SQL NVARCHAR(MAX)

SELECT
  @object_name = '[' + OBJECT_SCHEMA_NAME(o.[object_id]) + '].[' + OBJECT_NAME([object_id]) + ']'
, @object_id = [object_id]
FROM (SELECT [object_id] = OBJECT_ID('dbo.${tableName}', 'U')) o

SELECT 'CREATE TABLE ' + @object_name + CHAR(13) + '(' + CHAR(13) + STUFF((
SELECT CHAR(13) + '    , [' + c.name + '] ' +
    CASE WHEN c.is_computed = 1
        THEN 'AS ' + OBJECT_DEFINITION(c.[object_id], c.column_id)
        ELSE
            CASE WHEN c.system_type_id != c.user_type_id
                THEN '[' + SCHEMA_NAME(tp.[schema_id]) + '].[' + tp.name + ']'
                ELSE '[' + UPPER(tp.name) + ']'
            END  +
            CASE
                WHEN tp.name IN ('varchar', 'char', 'varbinary', 'binary')
                    THEN '(' + CASE WHEN c.max_length = -1
                                    THEN 'MAX'
                                    ELSE CAST(c.max_length AS VARCHAR(5))
                                END + ')'
                WHEN tp.name IN ('nvarchar', 'nchar')
                    THEN '(' + CASE WHEN c.max_length = -1
                                    THEN 'MAX'
                                    ELSE CAST(c.max_length / 2 AS VARCHAR(5))
                                END + ')'
                WHEN tp.name IN ('datetime2', 'time2', 'datetimeoffset')
                    THEN '(' + CAST(c.scale AS VARCHAR(5)) + ')'
                WHEN tp.name = 'decimal'
                    THEN '(' + CAST(c.[precision] AS VARCHAR(5)) + ',' + CAST(c.scale AS VARCHAR(5)) + ')'
                ELSE ''
            END +
            CASE WHEN c.collation_name IS NOT NULL AND c.system_type_id = c.user_type_id
                THEN ' COLLATE ' + c.collation_name
                ELSE ''
            END +
            CASE WHEN c.is_nullable = 1
                THEN ' NULL'
                ELSE ' NOT NULL'
            END +
            CASE WHEN c.default_object_id != 0
                THEN ' CONSTRAINT [' + OBJECT_NAME(c.default_object_id) + ']' +
                     ' DEFAULT ' + OBJECT_DEFINITION(c.default_object_id)
                ELSE ''
            END +
            CASE WHEN cc.[object_id] IS NOT NULL
                THEN ' CONSTRAINT [' + cc.name + '] CHECK ' + cc.[definition]
                ELSE ''
            END +
            CASE WHEN c.is_identity = 1
                THEN ' IDENTITY(' + CAST(IDENTITYPROPERTY(c.[object_id], 'SeedValue') AS VARCHAR(5)) + ',' +
                                CAST(IDENTITYPROPERTY(c.[object_id], 'IncrementValue') AS VARCHAR(5)) + ')'
                ELSE ''
            END
    END
FROM sys.columns c WITH(NOLOCK)
JOIN sys.types tp WITH(NOLOCK) ON c.user_type_id = tp.user_type_id
LEFT JOIN sys.check_constraints cc WITH(NOLOCK)
     ON c.[object_id] = cc.parent_object_id
    AND cc.parent_column_id = c.column_id
WHERE c.[object_id] = @object_id
ORDER BY c.column_id
FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 7, '      ') +
ISNULL((SELECT '
, CONSTRAINT [' + i.name + '] PRIMARY KEY ' +
CASE WHEN i.index_id = 1
    THEN 'CLUSTERED'
    ELSE 'NONCLUSTERED'
END +' (' + (
SELECT STUFF(CAST((
    SELECT ', [' + COL_NAME(ic.[object_id], ic.column_id) + ']' +
            CASE WHEN ic.is_descending_key = 1
                THEN ' DESC'
                ELSE ''
            END
    FROM sys.index_columns ic WITH(NOLOCK)
    WHERE i.[object_id] = ic.[object_id]
        AND i.index_id = ic.index_id
    FOR XML PATH(N''), TYPE) AS NVARCHAR(MAX)), 1, 2, '')) + ')'
FROM sys.indexes i WITH(NOLOCK)
WHERE i.[object_id] = @object_id
    AND i.is_primary_key = 1), '') + CHAR(13) + ');' AS create_table
`;
}

function toServerDialect(dialect: keyof typeof SQLDialect): string {
  switch (dialect) {
    case 'MYSQL':
      return 'mysql';
    case SQLDialect.PLSQL:
      return 'oracle';
    case SQLDialect.TSQL:
      return 'mssql';
    default:
      return 'postgresql';
  }
}
