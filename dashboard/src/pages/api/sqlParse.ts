import { A_Expr, InsertStmt, OneOfInsertStmt } from 'libpg-query';
import { SelectStmt } from 'libpg-query';
import { OneOfA_Expr } from 'libpg-query';
import { OneOfString } from 'libpg-query';
import { OneOfColumnRef } from 'libpg-query';
import { RawStmt, OneOfSelectStmt, OneOfRangeVar } from 'libpg-query';
import { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'pgsql-parser';
import { inspect } from 'util';

type Schema = {
  [tableName: string]: { [columnName: string]: { dataType: string; isMandatory: boolean } } & {
    recordCount: number;
  };
};

async function sqlParse(req: NextApiRequest, res: NextApiResponse) {
  console.log('Handling request', {
    app: 'parse',
    meta: req.body,
  });
  const t1 = Date.now();
  const { content, schema } = req.body;
  // try to parse content
  let parsedContent: { RawStmt: RawStmt }[];
  try {
    parsedContent = parse(content);
  } catch (e: any) {
    return res.status(400).json({ message: e?.message ?? 'Unknown error' });
  }
  console.log('Parsed content', {
    app: 'parse',
    meta: parsedContent,
  });
  // validate parsed content
  const rawStmt = parsedContent[0].RawStmt as RawStmt;
  let validationErr: string = '';
  try {
    validationErr = validateStatement(rawStmt, schema);
  } catch (e: any) {
    console.error('Error validating statement', {
      app: 'parse',
      meta: {
        error: e?.message ?? 'Unknown error',
        rawStmt: inspect(rawStmt, { depth: 4 }),
      },
    });
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
  return res.status(200).json(parsedContent);
}

export default sqlParse;

function validateStatement(rawStmt: RawStmt, schema: Schema): string {
  let err = '';
  // validate select statement
  const selectStmt = extractSelectStmt(rawStmt.stmt);
  if (selectStmt) {
    err = validateSelectStmt(selectStmt, schema);
  }
  // validate insert statement
  const insertStmt = extractInsertStmt(rawStmt.stmt);
  if (insertStmt) {
    err = validateInsertStmt(insertStmt, schema);
  }
  // todo: validate update statement
  // todo: validate delete statement
  return err;
}

function validateSelectStmt(selectStmt: SelectStmt, schema: Schema): string {
  let err = '';
  const schemaColumns = Object.values(schema)
    .map(t => Object.keys(t))
    .flat();
  const resTargetVals = selectStmt.targetList?.map(t => t.ResTarget?.val);
  const columnNames: string[] = [];
  for (const resTarget of resTargetVals ?? []) {
    const columnName = extractColumnNameIfColumnRef(resTarget);
    if (!!columnName && !schemaColumns.includes(columnName ?? '')) {
      return `Column "${columnName}" does not exist in schema`;
    } else if (!!columnName) {
      columnNames.push(columnName);
    }
  }
  const fromClause = selectStmt.fromClause?.[0];
  if (fromClause) {
    const relName = extractRelNameIfRangeVar(fromClause);
    if (relName && !schema[relName]) {
      return `Table "${relName}" does not exist in schema`;
    } else if (relName) {
      const columns = Object.keys(schema[relName]);
      for (const columnName of columnNames ?? []) {
        if (!columns.includes(columnName ?? '')) {
          return `Column "${columnName}" does not exist in table "${relName}"`;
        }
      }
    }
  }
  const whereClause = selectStmt.whereClause;
  if (whereClause) {
    const aExpr = extractAExpr(whereClause);
    if (aExpr) {
      const left = aExpr.lexpr;
      const leftColumnName = extractColumnNameIfColumnRef(left);
      if (!!leftColumnName && !schemaColumns.includes(leftColumnName)) {
        return `Column "${leftColumnName}" does not exist in schema`;
      }
      const right = aExpr.rexpr;
      const rightColumnName = extractColumnNameIfColumnRef(right);
      if (!!rightColumnName && !schemaColumns.includes(rightColumnName)) {
        return `Column "${rightColumnName}" does not exist in schema`;
      }
    }
  }
  return err;
}

function extractSelectStmt(obj: any): SelectStmt | undefined {
  if (Object.getOwnPropertyNames(obj).find(k => k === 'SelectStmt')) {
    return (obj as OneOfSelectStmt).SelectStmt as SelectStmt;
  }
  return undefined;
}

function extractAExpr(obj: any): A_Expr | undefined {
  if (Object.getOwnPropertyNames(obj).find(k => k === 'A_Expr')) {
    return (obj as OneOfA_Expr).A_Expr as A_Expr;
  }
  return undefined;
}

function extractRelNameIfRangeVar(obj: any): string | undefined {
  if (Object.getOwnPropertyNames(obj).find(k => k === 'RangeVar')) {
    return (obj as OneOfRangeVar).RangeVar.relname;
  }
  return undefined;
}

function extractColumnNameIfColumnRef(obj: any): string | undefined {
  if (Object.getOwnPropertyNames(obj).find(k => k === 'ColumnRef')) {
    const columnRef = (obj as OneOfColumnRef).ColumnRef;
    const columnField = columnRef.fields[0];
    if (Object.getOwnPropertyNames(columnField).find(k => k === 'String')) {
      return (columnField as OneOfString).String.str;
    }
  }
  return undefined;
}

function extractInsertStmt(obj: any): InsertStmt | undefined {
  if (Object.getOwnPropertyNames(obj ?? {}).find(k => k === 'InsertStmt')) {
    return (obj as OneOfInsertStmt).InsertStmt as InsertStmt;
  }
  return undefined;
}

function validateInsertStmt(insertStmt: InsertStmt, schema: Schema): string {
  let err = '';
  const relName = extractRelNameIfRangeVar(insertStmt.relation);
  if (relName && !schema[relName]) {
    return `Table "${relName}" does not exist in schema`;
  } else if (relName) {
    const tableColumns = Object.keys(schema[relName]);
    const resTargetValues = insertStmt.cols?.map(c => c.ResTarget?.val);
    for (const resTargetVal of resTargetValues ?? []) {
      const columnName = extractColumnNameIfColumnRef(resTargetVal);
      if (!!columnName && !tableColumns.includes(columnName ?? '')) {
        return `Column "${columnName}" does not exist in table "${relName}"`;
      }
    }
  }
  return err;
}
