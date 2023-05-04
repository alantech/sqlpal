import {
  A_Expr,
  BoolExpr,
  DeleteStmt,
  InsertStmt,
  OneOfA_Expr,
  OneOfBoolExpr,
  OneOfColumnRef,
  OneOfDeleteStmt,
  OneOfInsertStmt,
  OneOfRangeVar,
  OneOfSelectStmt,
  OneOfString,
  OneOfUpdateStmt,
  SelectStmt,
  UpdateStmt,
} from 'libpg-query';

// Extract statements from AST

export function extractSelectStmt(obj: any): SelectStmt | undefined {
  if (Object.getOwnPropertyNames(obj ?? {}).find(k => k === 'SelectStmt')) {
    return (obj as OneOfSelectStmt).SelectStmt as SelectStmt;
  }
  return undefined;
}

export function extractInsertStmt(obj: any): InsertStmt | undefined {
  if (Object.getOwnPropertyNames(obj ?? {}).find(k => k === 'InsertStmt')) {
    return (obj as OneOfInsertStmt).InsertStmt as InsertStmt;
  }
  return undefined;
}

export function extractUpdateStmt(obj: any): UpdateStmt | undefined {
  if (Object.getOwnPropertyNames(obj ?? {}).find(k => k === 'UpdateStmt')) {
    return (obj as OneOfUpdateStmt).UpdateStmt as UpdateStmt;
  }
  return undefined;
}

export function extractDeleteStmt(obj: any): DeleteStmt | undefined {
  if (Object.getOwnPropertyNames(obj ?? {}).find(k => k === 'DeleteStmt')) {
    return (obj as OneOfDeleteStmt).DeleteStmt as DeleteStmt;
  }
  return undefined;
}

// Extract expressions from AST

export function extractBoolExpr(whereClause: any): BoolExpr | undefined {
  if (Object.getOwnPropertyNames(whereClause ?? {}).find(k => k === 'BoolExpr')) {
    return (whereClause as OneOfBoolExpr).BoolExpr as BoolExpr;
  }
  return undefined;
}

export function extractAExpr(obj: any): A_Expr | undefined {
  if (Object.getOwnPropertyNames(obj ?? {}).find(k => k === 'A_Expr')) {
    return (obj as OneOfA_Expr).A_Expr as A_Expr;
  }
  return undefined;
}

export function extractRelNameIfRangeVar(obj: any): string | undefined {
  if (Object.getOwnPropertyNames(obj ?? {}).find(k => k === 'RangeVar')) {
    return (obj as OneOfRangeVar).RangeVar.relname;
  } else if (Object.getOwnPropertyNames(obj ?? {}).find(k => k === 'relname')) {
    return obj.relname;
  }
  return undefined;
}

export function extractColumnNameIfColumnRef(obj: any): string | undefined {
  if (Object.getOwnPropertyNames(obj ?? {}).find(k => k === 'ColumnRef')) {
    const columnRef = (obj as OneOfColumnRef).ColumnRef;
    const columnField = columnRef.fields[0];
    if (Object.getOwnPropertyNames(columnField ?? {}).find(k => k === 'String')) {
      return (columnField as OneOfString).String.str;
    }
  }
  return undefined;
}
