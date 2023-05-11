import { NextApiRequest, NextApiResponse } from 'next';
import { SQLSurveyor, SQLDialect, ParsedSql, ParsedQuery } from 'sql-surveyor';

type Schema = {
  [tableName: string]: { [columnName: string]: { dataType: string; isMandatory: boolean } } & {
    recordCount: number;
  };
};

async function validate(req: NextApiRequest, res: NextApiResponse) {
  console.log('Handling request', {
    app: 'parse',
    meta: req.body,
  });
  const t1 = Date.now();
  const { content, schema } = req.body;
  let validationErr: string;
  try {
    // TODO: make dialect configurable
    const surveyor = new SQLSurveyor(SQLDialect.PLpgSQL);
    const parsedSql = surveyor.survey(content);
    console.dir(parsedSql, { depth: null });
    validationErr = validateParsedSql(parsedSql, schema);
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
  const columns = parsedQuery.outputColumns;
  for (const column of Object.values(columns)) {
    if (column.columnName && column.columnName !== '*' && !tables.some(t => schema[t]?.[column.columnName])) {
      errs.push(`Column "${column.columnName}" does not exist in tables "${tables.join(', ')}"`);
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
