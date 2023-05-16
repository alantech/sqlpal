import hashlib
import logging
import os
from flask import current_app, jsonify, make_response, session
from langchain import SQLDatabase
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session
import concurrent.futures
from sqlalchemy.sql import text
import re

logger = logging.getLogger(__name__)


def get_id_from_conn_str(conn_str):
    hash_value = hashlib.sha256(conn_str.encode('utf-8')).hexdigest()
    return hash_value[:54]  # for compatibility between indexes


def connect_to_db(request):
    Base = declarative_base()

    conn_str = request.json.get('conn_str', None)
    dialect = request.json.get('dialect', None)
    # try to fix the postgres endpoint deprecation
    if conn_str:
        if conn_str.startswith("postgres://"):
            conn_str = conn_str.replace("postgres://", "postgresql://", 1)
        session['conn_str'] = get_id_from_conn_str(conn_str)

        # connect and create all tables
        try:
            # If mssql, add the driver param
            if dialect.lower() == 'tsql':
                conn_str_split = conn_str.split("?")
                query_params = conn_str_split[1] if len(
                    conn_str_split) > 1 else None
                if query_params is not None:
                    params = query_params.split("&")
                    # filter out the driver param
                    params = list(
                        filter(lambda p: not p.startswith("driver"), params))
                    params.append("driver=ODBC Driver 18 for SQL Server")
                    query_params = "&".join(params)
                else:
                    query_params = "driver=ODBC Driver 18 for SQL Server"
                conn_str = conn_str_split[0] + "?" + query_params
            # todo: how to handle errors trying to connect to the db (e.g. driver errors)?
            db = SQLDatabase.from_uri(conn_str, sample_rows_in_table_info=current_app.config.get(
                'SAMPLE_ROWS_IN_TABLE_INFO'), indexes_in_table_info=True)

            if os.environ.get('USE_DATABASE'):
                Base.metadata.create_all(db._engine)

            return db, None
        except Exception as e:
            logger.exception(e)
            return None, make_response(jsonify({'error': 'Could not connect to database'}), 500)
    else:
        return None, make_response(jsonify({'error': 'No connection string provided'}), 400)


def get_schema_dict(db: SQLDatabase):
    tables = db.get_usable_table_names()
    schema = {}
    for table in tables:
        columns = [
            col.name for tbl in db._metadata.sorted_tables for col in tbl.columns if tbl.name == table]
        for column in columns:
            if table not in schema:
                schema[table] = {}
            schema[table][column] = 1
    return schema


def analyze_query(db, query):
    dialect = db.dialect
    sess = Session(bind=db._engine)
    if dialect.lower() == 'postgresql':
        try:
            result = sess.execute(text("""EXPLAIN """+query)).fetchall()
            if len(result) > 0 and 'Error' not in result[0][0]:
                # query has been successfully explained
                return True
        except Exception as e:
            logger.info("Error while explaining query: "+str(e))
            return False
        return False

    # no dialect covered, just return as valid
    return True


def explain_query(db: SQLDatabase, query, timeout):
    # perform a query explain with a given timeout
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        # Submit the function call to the thread pool
        future = executor.submit(analyze_query, db, query)

        try:
            # Wait for the function to complete, or raise a TimeoutError if it takes too long
            result = future.result(timeout=timeout/1000)
        except concurrent.futures.TimeoutError:
            # Cancel the function call if it takes too long
            logger.info("Analyze took so long, cancelling")
            future.cancel()
            return True
        else:
            # Process the result
            return result


def extract_queries_from_result(result):
    # transform newlines to spaces, and trim
    result = re.sub(r'\n', ' ', result)
    if len(result) > 0:
        if ";" in result:
            result = result.split(";")[0]
        return [result.strip()+";"]
    else:
        return [""]
