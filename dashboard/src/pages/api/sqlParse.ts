import { A_Expr } from 'libpg-query';
import { SelectStmt } from 'libpg-query';
import { OneOfA_Expr } from 'libpg-query';
import { OneOfString } from 'libpg-query';
import { OneOfColumnRef } from 'libpg-query';
import { RawStmt, OneOfSelectStmt, OneOfRangeVar } from 'libpg-query';
import { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'pgsql-parser';
import { inspect } from 'util';

async function sqlParse(req: NextApiRequest, res: NextApiResponse) {
  console.log('Handling request', {
    app: 'parse',
    env: process.env.IASQL_ENV,
    meta: req.body,
  });
  const t1 = Date.now();
  const { content, schema } = req.body;
  // try to parse content
  let parsedContent: { RawStmt: RawStmt }[];
  try {
    parsedContent = parse(content);
  } catch (e: any) {
    return res.status(401).json({ message: e?.message ?? 'Unknown error' });
  }
  console.log('Parsed content', {
    app: 'parse',
    env: process.env.IASQL_ENV,
    meta: parsedContent,
  });
  // validate parsed content
  const rawStmt = parsedContent[0].RawStmt as RawStmt;
  const validationErr: string = validateStatement(rawStmt, schema);
  const t2 = Date.now();
  console.log(`Total runtime took ${t2 - t1}`, {
    app: 'parse',
    meta: {
      t2,
      t1,
    },
  });
  if (validationErr) res.status(400).json({ message: validationErr });
  return res.status(200).json(parsedContent);
}

export default sqlParse;

function validateStatement(rawStmt: RawStmt, schema: any): string {
  let res = '';
  // validate select statement
  if (Object.getOwnPropertyNames(rawStmt.stmt).find(k => k === 'SelectStmt')) {
    try {
      res = validateSelectStmt((rawStmt.stmt as OneOfSelectStmt).SelectStmt, schema);
    } catch (e: any) {
      console.error('Error validating select statement', {
        app: 'parse',
        meta: {
          error: e?.message ?? 'Unknown error',
          rawStmt: JSON.stringify(rawStmt, null, 2),
        },
      });
    }
  }
  // todo: validate insert statement
  // todo: validate update statement
  // todo: validate delete statement
  return res;
}

function validateSelectStmt(
  selectStmt: SelectStmt,
  schema: {
    [tableName: string]: { [columnName: string]: { dataType: string; isMandatory: boolean } } & {
      recordCount: number;
    };
  },
): string {
  let err = '';
  console.log(`select statement ${inspect(selectStmt, { depth: 5 })}`);
  console.log(`schema ${inspect(schema, { depth: 5 })}`);
  const schemaColumns = Object.values(schema)
    .map(t => Object.keys(t))
    .flat();
  console.log(`schema columns ${inspect(schemaColumns, { depth: 5 })}`);
  console.log(`target list ${inspect(selectStmt.targetList, { depth: 5 })}`);
  const resTargetVals = selectStmt.targetList?.map(t => t.ResTarget?.val);
  const columnNames: string[] = [];
  console.log(`column names ${inspect(resTargetVals, { depth: 5 })}`);
  for (const resTarget of resTargetVals ?? []) {
    if (Object.getOwnPropertyNames(resTarget).find(k => k === 'ColumnRef')) {
      const columnRef = (resTarget as OneOfColumnRef).ColumnRef;
      const columnField = columnRef.fields[0];
      if (Object.getOwnPropertyNames(columnField).find(k => k === 'String')) {
        const columnName = (columnField as OneOfString).String.str;
        columnNames.push(columnName);
        if (!schemaColumns.includes(columnName ?? '')) {
          return `Column "${columnName}" does not exist in schema`;
        }
      }
    }
  }
  const fromClause = selectStmt.fromClause?.[0];
  if (fromClause) {
    if (Object.getOwnPropertyNames(fromClause).find(k => k === 'RangeVar')) {
      const relName = (fromClause as OneOfRangeVar).RangeVar.relname;
      if (!schema[relName]) {
        return `Table "${relName}" does not exist in schema`;
      } else {
        const columns = Object.keys(schema[relName]);
        for (const columnName of columnNames ?? []) {
          if (!columns.includes(columnName ?? '')) {
            return `Column "${columnName}" does not exist in table "${relName}"`;
          }
        }
      }
    }
  }
  const whereClause = selectStmt.whereClause;
  if (whereClause) {
    console.log(`where clause ${inspect(whereClause, { depth: 5 })}`);
    if (Object.getOwnPropertyNames(whereClause).find(k => k === 'A_Expr')) {
      const aExpr = (whereClause as OneOfA_Expr).A_Expr as A_Expr;
      const left = aExpr.lexpr;
      const right = aExpr.rexpr;
      if (Object.getOwnPropertyNames(left).find(k => k === 'ColumnRef')) {
        const columnRef = (left as OneOfColumnRef).ColumnRef;
        const columnField = columnRef.fields[0];
        if (Object.getOwnPropertyNames(columnField).find(k => k === 'String')) {
          const columnName = (columnField as OneOfString).String.str;
          if (!schemaColumns.includes(columnName)) {
            return `Column "${columnName}" does not exist in schema`;
          }
        }
      }
      if (Object.getOwnPropertyNames(right).find(k => k === 'ColumnRef')) {
        const columnRef = (right as OneOfColumnRef).ColumnRef;
        const columnField = columnRef.fields[0];
        if (Object.getOwnPropertyNames(columnField).find(k => k === 'String')) {
          const columnName = (columnField as OneOfString).String.str;
          if (!schemaColumns.includes(columnName)) {
            return `Column "${columnName}" does not exist in schema`;
          }
        }
      }
    }
  }
  return err;
}
