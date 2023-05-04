import { DeleteStmt, InsertStmt, SelectStmt, UpdateStmt, RawStmt, OneOfResTarget } from 'libpg-query';

import { Schema } from './validate';
import {
  extractAExpr,
  extractBoolExpr,
  extractColumnNameIfColumnRef,
  extractDeleteStmt,
  extractInsertStmt,
  extractRelNameIfRangeVar,
  extractSelectStmt,
  extractUpdateStmt,
} from './extractors';

// Validate statements

export function validateStatement(rawStmt: RawStmt, schema: Schema): string {
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
  // validate update statement
  const updateStmt = extractUpdateStmt(rawStmt.stmt);
  if (updateStmt) {
    err = validateUpdateStmt(updateStmt, schema);
  }
  // validate delete statement
  const deleteStmt = extractDeleteStmt(rawStmt.stmt);
  if (deleteStmt) {
    err = validateDeleteStmt(deleteStmt, schema);
  }
  return err;
}

export function validateSelectStmt(selectStmt: SelectStmt, schema: Schema): string {
  let err = '';
  const schemaColumns = Object.values(schema)
    .map(t => Object.keys(t))
    .flat();
  const targetListValidation = validateTargetList(
    selectStmt.targetList ?? [],
    schemaColumns,
    undefined,
    true,
  );
  if (targetListValidation && typeof targetListValidation === 'string') return targetListValidation;
  const columnNames = targetListValidation as string[];
  const fromClause = selectStmt.fromClause?.[0];
  if (fromClause) {
    const relName = extractRelNameIfRangeVar(fromClause);
    const relNameErr = validateRelName(relName, schema);
    if (relNameErr) return relNameErr;
    if (relName) {
      const tableColumns = Object.keys(schema[relName]);
      for (const columnName of columnNames ?? []) {
        if (!tableColumns.includes(columnName ?? '')) {
          return `Column "${columnName}" does not exist in table "${relName}"`;
        }
      }
    }
  }
  const whereClauseErr = validateWhereClause(selectStmt.whereClause, schema);
  if (whereClauseErr) return whereClauseErr;
  return err;
}

export function validateInsertStmt(insertStmt: InsertStmt, schema: Schema): string {
  let err = '';
  const relName = extractRelNameIfRangeVar(insertStmt.relation);
  const relNameErr = validateRelName(relName, schema);
  if (relNameErr) return relNameErr;
  if (relName) {
    const tableColumns = Object.keys(schema[relName]);
    const targetListErr = validateTargetList(insertStmt.cols ?? [], tableColumns, relName);
    if (typeof targetListErr === 'string' && !!targetListErr) return targetListErr;
  }
  return err;
}

export function validateUpdateStmt(updateStmt: UpdateStmt, schema: Schema): string {
  let err = '';
  const relName = extractRelNameIfRangeVar(updateStmt.relation);
  const relNameErr = validateRelName(relName, schema);
  if (relNameErr) return relNameErr;
  if (relName) {
    const tableColumns = Object.keys(schema[relName]);
    const targetListErr = validateTargetList(updateStmt.targetList, tableColumns, relName);
    if (targetListErr && typeof targetListErr === 'string') return targetListErr as string;
  }
  const whereClauseErr = validateWhereClause(updateStmt.whereClause, schema);
  if (whereClauseErr) return whereClauseErr;
  return err;
}

export function validateDeleteStmt(deleteStmt: DeleteStmt, schema: Schema): string {
  let err = '';
  const relName = extractRelNameIfRangeVar(deleteStmt.relation);
  const relNameErr = validateRelName(relName, schema);
  if (relNameErr) return relNameErr;
  const whereClauseErr = validateWhereClause(deleteStmt.whereClause, schema);
  if (whereClauseErr) return whereClauseErr;
  return err;
}

// Validate expressions

export function validateWhereClause(whereClause: any, schema: Schema): string {
  let err = '';
  if (!whereClause) return err;
  let columns = Object.values(schema)
    .map(t => Object.keys(t))
    .flat();
  const aExpr = extractAExpr(whereClause);
  if (aExpr) {
    const left = aExpr.lexpr;
    const leftColumnName = extractColumnNameIfColumnRef(left);
    if (!!leftColumnName && !columns.includes(leftColumnName ?? '')) {
      return `Column "${leftColumnName}" does not exist in schema`;
    }
    const right = aExpr.rexpr;
    const rightColumnName = extractColumnNameIfColumnRef(right);
    if (!!rightColumnName && !columns.includes(rightColumnName ?? '')) {
      return `Column "${rightColumnName}" does not exist in schema`;
    }
  }
  const boolExpr = extractBoolExpr(whereClause);
  if (boolExpr) {
    const args = boolExpr.args;
    for (const arg of args) {
      const argErr = validateWhereClause(arg, schema);
      if (argErr) return argErr;
    }
  }
  return err;
}

export function validateRelName(relName: string | undefined, schema: Schema): string {
  if (relName && !schema[relName]) {
    return `Table "${relName}" does not exist in schema`;
  }
  return '';
}

export function validateTargetList(
  targetList: Array<OneOfResTarget>,
  relevantColumns: string[],
  relName?: string,
  returnColumns = false,
): string | string[] {
  let err = '';
  const columns: string[] = (targetList ?? []).map(t => t.ResTarget?.name ?? '').filter(v => !!v);
  if (columns.length) {
    for (const col of columns) {
      if (!relevantColumns.includes(col)) {
        return `Column "${col}" does not exist in ${relName ? `table "${relName}"` : 'schema'}`;
      }
    }
  } else {
    const resTargetValues = (targetList ?? []).map(t => t.ResTarget?.val).filter(v => !!v);
    for (const resTargetVal of resTargetValues) {
      const columnName = extractColumnNameIfColumnRef(resTargetVal);
      if (!!columnName && !relevantColumns.includes(columnName)) {
        return `Column "${columnName}" does not exist in ${relName ? `table "${relName}"` : 'schema'}`;
      } else if (!!columnName) {
        columns.push(columnName);
      }
    }
  }
  if (returnColumns) {
    return columns;
  }
  return err;
}
