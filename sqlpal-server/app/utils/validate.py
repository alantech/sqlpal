from pglast import ast

def validate_select(stmt, columns_by_table_dict):
    # todo: improve this later. for now just check is a valid column in the schema. Then we can check if the column is valid for the table, but for that we would need to dig deeper in the ast
    columns = [col for table in columns_by_table_dict for col in columns_by_table_dict[table]]
    # validate target list to see if they are valid columns
    if stmt.targetList is None:
      for f in [f for rt in stmt.targetList for f in rt.val.fields]:
          if f.sval not in columns:
              return False

    # validate from clause to see if they are valid tables
    if stmt.fromClause is None:
      for rv in stmt.fromClause:
          if rv.relname not in columns_by_table_dict:
              return False

    # validate where clause to see if they are valid columns
    if stmt.whereClause is not None and isinstance(stmt.whereClause.lexpr, ast.ColumnRef) and stmt.whereClause.lexpr.fields[0].sval not in columns:
      return False
    elif stmt.whereClause is not None and isinstance(stmt.whereClause.rexpr, ast.ColumnRef) and stmt.whereClause.rexpr.fields[0].sval not in columns:
      return False

    # todo: validate group by clause to see if they are valid columns
    # todo: validate having clause to see if they are valid columns
    # todo: validate order by clause to see if they are valid columns

    return True

def validate_insert(stmt, columns_by_table_dict):
    if stmt.relation is not None:
        table_name = stmt.relation.relname
        if table_name not in columns_by_table_dict:
            return False
        for rt in stmt.cols:
            if rt.name not in columns_by_table_dict[table_name]:
                return False
    return True

def validate_update(stmt, columns_by_table_dict):
    if stmt.relation is not None:
        table_name = stmt.relation.relname
        if table_name not in columns_by_table_dict:
            return False
        # Checking SET clause
        for rt in stmt.targetList:
            if rt.name not in columns_by_table_dict[table_name]:
                return False
    # Checking WHERE clause
    # todo: improve this later. for now just check is a valid column in the schema. Then we can check if the column is valid for the table, but for that we would need to dig deeper in the ast
    columns = [col for table in columns_by_table_dict for col in columns_by_table_dict[table]]
    if stmt.whereClause is not None and isinstance(stmt.whereClause.lexpr, ast.ColumnRef) and stmt.whereClause.lexpr.fields[0].sval not in columns:
        return False
    elif stmt.whereClause is not None and isinstance(stmt.whereClause.rexpr, ast.ColumnRef) and stmt.whereClause.rexpr.fields[0].sval not in columns:
        return False
    return True

def validate_delete(stmt, columns_by_table_dict):
    if stmt.relation is not None:
        table_name = stmt.relation.relname
        if table_name not in columns_by_table_dict:
            return False
    # Checking WHERE clause
    # todo: improve this later. for now just check is a valid column in the schema. Then we can check if the column is valid for the table, but for that we would need to dig deeper in the ast
    columns = [col for table in columns_by_table_dict for col in columns_by_table_dict[table]]
    if stmt.whereClause is not None and isinstance(stmt.whereClause.lexpr, ast.ColumnRef) and stmt.whereClause.lexpr.fields[0].sval not in columns:
        return False
    elif stmt.whereClause is not None and isinstance(stmt.whereClause.rexpr, ast.ColumnRef) and stmt.whereClause.rexpr.fields[0].sval not in columns:
        return False
    return True
