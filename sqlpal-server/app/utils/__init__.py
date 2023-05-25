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


def connect_to_db(request: dict):
    Base = declarative_base()

    # get db credentials from env vars
    user: str = os.environ.get('POSTGRES_USER', None)
    password: str = os.environ.get('POSTGRES_PASSWORD', None)
    db_name: str = os.environ.get('POSTGRES_DB', None)
    
    if user is None or password is None or db_name is None:
        return None, make_response(jsonify({'error': 'No database credentials provided'}), 400)
    
    # connection string
    conn_str = f'postgresql://{user}:{password}@sqlpal_db:5433/{db_name}'

    # save session variable to identify the connection and the index
    # TODO: once we have authentication, we can use another identifier
    usr_conn_str = request.json.get('conn_str', None)
    session['conn_str'] = get_id_from_conn_str(usr_conn_str)

    # connect and create all tables
    try:
        # todo: how to handle errors trying to connect to the db (e.g. driver errors)?
        db = SQLDatabase.from_uri(conn_str)
        Base.metadata.create_all(db._engine)
        return db, None
    except Exception as e:
        logger.exception(e)
        return None, make_response(jsonify({'error': 'Could not connect to database'}), 500)

# TODO: do this in the client side
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


# TODO: do this in the client side
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
