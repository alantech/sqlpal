import { SQLSurveyor, SQLDialect, ParsedSql, ParsedQuery } from 'sql-surveyor';
import { Schema } from './util';

// Regex to extract function arguments
const functionRegex = /^\s*\w+\s*\(/;
const argumentRegex = /^\s*(\w+)\s*\((.*)\)/g;

async function validate(
  content: string,
  schema: Schema,
  dialect: keyof typeof SQLDialect
) {
  console.log('Handling request', {
    app: 'parse',
    meta: {
      content,
      schema,
      dialect,
    },
  });
  const t1 = Date.now();
  let validationErr: string;
  try {
    const extractedDialect = extractDialect(dialect, false);
    const surveyor = new SQLSurveyor(
      SQLDialect[extractedDialect] ?? SQLDialect.PLpgSQL
    );
    const parsedSql = surveyor.survey(content);
    if (
      parsedSql &&
      parsedSql.parsedQueries &&
      Object.keys(parsedSql.parsedQueries).length > 0
    ) {
      // Make sure that all tableNames and columnNames in body.schema are lowercase
      const normalizedSchema: Schema = normalizeSchema(schema);
      validationErr = validateParsedSql(parsedSql, normalizedSchema);
    } else if (content && (content as string).startsWith('--')) {
      validationErr = '';
    } else {
      validationErr = 'Invalid query';
    }
  } catch (e: any) {
    return { message: e?.message ?? 'Unknown error' };
  }
  const t2 = Date.now();
  console.log(`Total runtime took ${t2 - t1}`, {
    app: 'parse',
    meta: {
      t2,
      t1,
    },
  });
  if (validationErr) return { message: validationErr };
  return {};
}

export default validate;

function normalizeSchema(schema: Schema): Schema {
  const normalizedSchema: Schema = {};
  for (const [tableName, table] of Object.entries(schema)) {
    const normalizedTable: any = {};
    for (const [columnName, column] of Object.entries(table)) {
      normalizedTable[columnName.toLowerCase()] = column;
    }
    normalizedSchema[tableName.toLowerCase()] = normalizedTable;
  }
  return normalizedSchema;
}

function extractDialect(
  dialect: string,
  fromServer = false
): keyof typeof SQLDialect {
  if (fromServer) {
    // Python sql alchemy dialects are: 'postgresql', 'mysql', 'oracle', 'mssql'
    switch (dialect) {
      case 'mysql':
        return 'MYSQL';
      case 'oracle':
        return SQLDialect.PLSQL;
      case 'mssql':
        return SQLDialect.TSQL;
      default:
        return SQLDialect.PLpgSQL;
    }
  }
  return dialect as keyof typeof SQLDialect;
}

function validateParsedSql(parsedSql: ParsedSql, schema: Schema): string {
  let errs: string[] = [];
  for (const parsedQuery of Object.values(parsedSql.parsedQueries ?? {})) {
    errs = errs.concat(validateParsedQuery(parsedQuery, schema));
    // Check sub-queries
    for (const parsedSubQuery of Object.values(parsedQuery.subqueries ?? {})) {
      const subQueryErrors = validateParsedQuery(parsedSubQuery, schema);
      errs = errs.concat(subQueryErrors);
    }
  }
  return errs.join('\n');
}

function validateParsedQuery(
  parsedQuery: ParsedQuery,
  schema: Schema
): string[] {
  let errs: string[] = [];
  // Check if parsing errors exist
  const queryErrors = extractQueryErrors(parsedQuery);
  // Check if table names are part of schema
  const tableErrors = validateTables(parsedQuery, schema);
  // Check if output columns are part of schema and table
  const outputColumnErrors = validateOutputColumns(parsedQuery, schema);
  // Check if referenced columns are part of the schema and table
  const referencedColumnErrors = validateReferencedColumns(parsedQuery, schema);
  return errs.concat(
    queryErrors,
    tableErrors,
    outputColumnErrors,
    referencedColumnErrors
  );
}

function extractQueryErrors(parsedQuery: ParsedQuery): string[] {
  let errs: string[] = [];
  parsedQuery.queryErrors?.forEach((e) => {
    // TODO: Improve error messaging giving meaningful error messages for each error type
    errs.push(`Error near ${e.token.value}. ${e.type}`);
  });
  return errs;
}

function validateTables(parsedQuery: ParsedQuery, schema: Schema): string[] {
  let errs: string[] = [];
  const tables = parsedQuery.referencedTables;
  for (const table of Object.values(tables)) {
    if (table.tableName && !schema[table.tableName.toLowerCase()]) {
      errs.push(`Table "${table.tableName}" does not exist in schema`);
    }
  }
  return errs;
}

function validateOutputColumns(
  parsedQuery: ParsedQuery,
  schema: Schema
): string[] {
  let errs: string[] = [];
  const tables = Object.keys(parsedQuery.referencedTables);
  const parsedOutputColumns = parsedQuery.outputColumns;
  const identifiers = Object.values(parsedQuery.tokens)
    .filter((t) => t.type === 'IDENTIFIER')
    .map((t) => t.value);
  for (const parsedOutputColumn of Object.values(parsedOutputColumns)) {
    let columnNames: string[] = [];
    const colTableName = tables.includes(parsedOutputColumn.tableName)
      ? parsedOutputColumn.tableName
      : undefined;
    const colTableAlias = parsedOutputColumn.tableAlias;
    let columnValue = parsedOutputColumn.columnName;
    if (columnValue.match(functionRegex)) {
      columnNames.push(...(extractArguments(columnValue) ?? []));
    } else columnNames.push(columnValue);
    // Keep only with `IDENTIFIERS`, removing literals, keywords, etc.
    columnNames = columnNames.filter((cn) => identifiers.includes(cn));
    // Remove table name and alias from column name
    columnNames = columnNames.map((cn) => {
      return cn
        .split('.')
        .filter((c) => c !== colTableName && c !== colTableAlias)
        .join('.');
    });
    // Check errors for each column name
    for (const columnName of columnNames) {
      if (
        columnName &&
        !columnName.includes('*') &&
        !tables.some((t) => schema[t.toLowerCase()]?.[columnName.toLowerCase()])
      ) {
        errs.push(
          `Column "${columnName}" does not exist in tables "${tables.join(
            ', '
          )}"`
        );
      }
    }
  }
  return errs;
}

function validateReferencedColumns(
  parsedQuery: ParsedQuery,
  schema: Schema
): string[] {
  let errs: string[] = [];
  const tables = Object.keys(parsedQuery.referencedTables);
  const columns = parsedQuery.referencedColumns;
  for (const column of Object.values(columns)) {
    if (
      column.columnName &&
      !tables.some(
        (t) => schema[t.toLowerCase()]?.[column.columnName.toLowerCase()]
      )
    ) {
      errs.push(
        `Column "${column.columnName}" does not exist in tables "${tables.join(
          ', '
        )}"`
      );
    }
  }
  return errs;
}

// Extract arguments from a function call string
function extractArguments(functionCall: string): string[] {
  // Using `any` here since theres a mismatch in the TS return type and the actual return type for `matchAll`
  // This will extract the function name in the first group and the arguments in the second group
  const matchArgs: any[][] = Array.from(functionCall.matchAll(argumentRegex));
  const finalArgs: string[] = [];
  for (const match of matchArgs) {
    // Get argument from second group
    const args = match[2].split(',');
    for (const arg of args) {
      // It could be a nested function call so we need to extract the arguments from it
      if (arg.match(functionRegex)) {
        const subArgs = extractArguments(arg);
        finalArgs.push(...subArgs);
      } else {
        finalArgs.push(arg);
      }
    }
  }
  return finalArgs;
}
