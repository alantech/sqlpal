import { NextApiRequest, NextApiResponse } from 'next';
import { SQLSurveyor, SQLDialect, ParsedSql, ParsedQuery } from 'sql-surveyor';

type Schema = {
  [tableName: string]: { [columnName: string]: { dataType: string; isMandatory: boolean } } & {
    recordCount: number;
  };
};

interface ValidateRequest {
  content: string;
  schema: Schema;
  dialect: keyof typeof SQLDialect;
  fromServer?: boolean;
}

// Regex to extract function arguments
const functionRegex = /^\s*\w+\s*\(/;
const argumentRegex = /^\s*(\w+)\s*\((.*)\)/g;

async function validate(req: NextApiRequest, res: NextApiResponse) {
  console.log('Handling request', {
    app: 'parse',
    meta: req.body,
  });
  const t1 = Date.now();
  const body: ValidateRequest = req.body;
  let validationErr: string;
  try {
    const dialect = extractDialect(body.dialect, body.fromServer);
    const surveyor = new SQLSurveyor(SQLDialect[dialect] ?? SQLDialect.PLpgSQL);
    const parsedSql = surveyor.survey(body.content);
    console.dir(parsedSql, { depth: null });
    validationErr = validateParsedSql(parsedSql, body.schema);
    console.log(`validation error: ${validationErr}`);
  } catch (e: any) {
    return res.status(400).json({ message: e?.message ?? 'Unknown error' });
  }
  const t2 = Date.now();
  console.log(`Total runtime took ${t2 - t1}`, {
    app: 'parse',
    meta: {
      t2,
      t1,
    },
  });
  if (validationErr) return res.status(400).json({ message: validationErr });
  return res.status(200).json({});
}

export default validate;

function extractDialect(dialect: string, fromServer = false): keyof typeof SQLDialect {
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

function validateParsedQuery(parsedQuery: ParsedQuery, schema: Schema): string[] {
  let errs: string[] = [];
  // Check if parsing errors exist
  const queryErrors = extractQueryErrors(parsedQuery);
  // Check if table names are part of schema
  const tableErrors = validateTables(parsedQuery, schema);
  // Check if output columns are part of schema and table
  const outputColumnErrors = validateOutputColumns(parsedQuery, schema);
  console.log('outputColumnErrors', outputColumnErrors);
  // Check if referenced columns are part of the schema and table
  const referencedColumnErrors = validateReferencedColumns(parsedQuery, schema);
  return errs.concat(queryErrors, tableErrors, outputColumnErrors, referencedColumnErrors);
}

function extractQueryErrors(parsedQuery: ParsedQuery): string[] {
  let errs: string[] = [];
  parsedQuery.queryErrors?.forEach(e => {
    // TODO: Improve error messaging giving meaningful error messages for each error type
    errs.push(`Error near ${e.token.value}. ${e.type}`);
  });
  return errs;
}

function validateTables(parsedQuery: ParsedQuery, schema: Schema): string[] {
  let errs: string[] = [];
  const tables = parsedQuery.referencedTables;
  for (const table of Object.values(tables)) {
    if (table.tableName && !schema[table.tableName]) {
      errs.push(`Table "${table.tableName}" does not exist in schema`);
    }
  }
  return errs;
}

function validateOutputColumns(parsedQuery: ParsedQuery, schema: Schema): string[] {
  let errs: string[] = [];
  const tables = Object.keys(parsedQuery.referencedTables);
  console.log('tables', tables);
  const parsedOutputColumns = parsedQuery.outputColumns;
  console.log('columns', JSON.stringify(parsedOutputColumns));
  const identifiers = Object.values(parsedQuery.tokens)
    .filter(t => t.type === 'IDENTIFIER')
    .map(t => t.value);
  for (const parsedOutputColumn of Object.values(parsedOutputColumns)) {
    let columnNames: string[] = [];
    const colTableName = tables.includes(parsedOutputColumn.tableName)
      ? parsedOutputColumn.tableName
      : undefined;
    const colTableAlias = parsedOutputColumn.tableAlias;
    let columnValue = parsedOutputColumn.columnName;
    if (columnValue.match(functionRegex)) {
      columnNames.push(...(extractArguments(columnValue) ?? []));
    }
    // Keep only with `IDENTIFIERS`, removing literals, keywords, etc.
    columnNames = columnNames.filter(cn => identifiers.includes(cn));
    // Remove table name and alias from column name
    columnNames = columnNames.map(cn => {
      return cn
        .split('.')
        .filter(c => c !== colTableName && c !== colTableAlias)
        .join('.');
    });
    // Check errors for each column name
    for (const columnName of columnNames) {
      if (columnName && !columnName.includes('*') && !tables.some(t => schema[t]?.[columnName])) {
        errs.push(`Column "${columnName}" does not exist in tables "${tables.join(', ')}"`);
      }
    }
  }
  return errs;
}

function validateReferencedColumns(parsedQuery: ParsedQuery, schema: Schema): string[] {
  let errs: string[] = [];
  const tables = Object.keys(parsedQuery.referencedTables);
  const columns = parsedQuery.referencedColumns;
  for (const column of Object.values(columns)) {
    if (column.columnName && !tables.some(t => schema[t]?.[column.columnName])) {
      errs.push(`Column "${column.columnName}" does not exist in tables "${tables.join(', ')}"`);
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
