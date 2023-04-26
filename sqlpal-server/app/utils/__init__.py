import hashlib
import logging
import os
import re
from flask import current_app, jsonify, make_response, session
from langchain import SQLDatabase
from sqlalchemy.ext.declarative import declarative_base

logger = logging.getLogger(__name__)


def get_id_from_conn_str(conn_str):
    hash_value = hashlib.sha256(conn_str.encode('utf-8')).hexdigest()
    return hash_value[:54]  # for compatibility between indexes


def connect_to_db(request):
    Base = declarative_base()

    conn_str = request.json.get('conn_str', None)
    # try to fix the postgres endpoint deprecation
    if conn_str:
        if conn_str.startswith("postgres://"):
            conn_str = conn_str.replace("postgres://", "postgresql://", 1)
        session['conn_str'] = get_id_from_conn_str(conn_str)

        try:
            # connect and create all tables
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
