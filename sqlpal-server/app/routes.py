import time

from flask import Blueprint, Flask, jsonify, make_response, request
from flask_cors import CORS, cross_origin
from dotenv import load_dotenv
import os
import openai
from .utils.embeddings import select_embeddings
from .utils.autocomplete import autocomplete_query_suggestions, generate_queries_for_schema
from .utils.indexes import select_index
from .utils.repair import repair_query_suggestions

from .utils import connect_to_db, explain_query, get_schema_dict
import logging

logger = logging.getLogger(__name__)

api_bp = Blueprint('api_bp', __name__)
app = Flask(__name__)
CORS(app, resources={
     r"/*": {"origins": "http://localhost:9876", "supports_credentials": True}})
app.config['CORS_HEADERS'] = 'Content-Type'

load_dotenv()
openai.api_key = os.environ.get('OPENAI_API_KEY')
TOTAL_AUTOCOMPLETE_TIME = os.environ.get('TOTAL_AUTOCOMPLETE_TIME', 3)
TOTAL_REPAIR_TIME = os.environ.get('TOTAL_REPAIR_TIME', 10)

@api_bp.route('/discover', methods=['OPTIONS', 'POST'])
@cross_origin(origin='http://localhost:9876', supports_credentials=True)
def discover():
    if request.method == 'OPTIONS':
        return make_response(jsonify({}), 200)

    db, error = connect_to_db(request)
    if error:
        return error

    index_engine = select_index()

    embeddings = select_embeddings()
    docsearch = index_engine.read_index(db, embeddings)

    tables = db.get_usable_table_names()
    texts = []
    metadatas = []
    table_queries = {}
    schema_dict = get_schema_dict(db)
    for table in [t for t in tables if t not in 'index_content']:
        info = db.get_table_info(table_names=[table])
        info = info.replace('\t', ' ').replace('\n', ' ')
        texts.append(info)
        metadatas.append({'type': 'schema'})

        if os.environ.get('GET_SAMPLE_QUERIES', False):
            queries = generate_queries_for_schema(info, schema_dict, db.dialect)
            if (queries and len(queries) > 0):
                table_queries[table] = queries

    # add to a vector search using embeddings
    docsearch = index_engine.read_index_contents(texts, embeddings, metadatas)
    index_engine.write_index(db, docsearch)

    # add sample queries
    if os.environ.get('GET_SAMPLE_QUERIES', False):
        for table, queries in table_queries.items():
            for query in queries:
                docsearch.add_texts([query], [{'type': 'query'}])
    index_engine.write_index(db, docsearch)

    response = jsonify({"status": 'OK'})
    return response


@api_bp.route('/autocomplete', methods=['OPTIONS', 'POST'])
@cross_origin(origin='http://localhost:9876', supports_credentials=True)
def autocomplete():
    if request.method == 'OPTIONS':
        return make_response(jsonify({}), 200)

    st = time.time()
    db, error = connect_to_db(request)
    if error:
        return error

    index_engine = select_index()

    embeddings = select_embeddings()
    docsearch = index_engine.read_index(db, embeddings)
    if docsearch is not None:
        query = request.json.get('query', None)
        if query:
            # execute query autocompletion
            result = autocomplete_query_suggestions(
                query.strip(), docsearch, db.dialect)
            et = time.time()
            elapsed_time = (et - st)*1000
            allowed_timeout = TOTAL_AUTOCOMPLETE_TIME*1000 - elapsed_time
            if allowed_timeout>0 and len(result)>0:
                # we can trigger the SQL explain, for just the total remainder time
                valid = explain_query(db, result[0], allowed_timeout)
                if not valid:
                    # just return a blank query
                    response = jsonify({'suggestions': []})
                    return response
            response = jsonify({'suggestions': result})
            return response
        else:
            return make_response(jsonify({'error': 'No query provided'}), 400)
    else:
        return make_response(jsonify({'error': 'Error retrieving index'}), 500)


@api_bp.route('/repair', methods=['OPTIONS', 'POST'])
@cross_origin(origin='http://localhost:9876', supports_credentials=True)
def repair():
    if request.method == 'OPTIONS':
        return make_response(jsonify({}), 200)

    st = time.time()
    db, error = connect_to_db(request)
    if error:
        return error

    index_engine = select_index()

    embeddings = select_embeddings()
    docsearch = index_engine.read_index(db, embeddings)
    if docsearch is not None:
        query = request.json.get('query', None)
        error_message = request.json.get('error_message', None)
        if query and error_message:
            # execute query repair
            result = repair_query_suggestions(
                query.strip(), error_message.strip(), docsearch, db.dialect)
            et = time.time()
            elapsed_time = (et - st)*1000
            allowed_timeout = TOTAL_AUTOCOMPLETE_TIME*1000 - elapsed_time
            if allowed_timeout>0 and len(result)>0:
                # we can trigger the SQL explain, for just the total remainder time
                valid = explain_query(db, result[0], allowed_timeout)
                if not valid:
                    # just return a blank query
                    response = jsonify({'suggestions': []})
                    return response            
            response = jsonify({'suggestions': result})
            return response
        else:
            return make_response(jsonify({'error': 'No query or error provided'}), 400)
    else:
        return make_response(jsonify({'error': 'Error retrieving index'}), 500)


@api_bp.route('/add', methods=['OPTIONS', 'POST'])
@cross_origin(origin='http://localhost:9876', supports_credentials=True)
def add():
    if request.method == 'OPTIONS':
        return make_response(jsonify({}), 200)

    db, error = connect_to_db(request)
    if error:
        return error

    index_engine = select_index()
    embeddings = select_embeddings()
    docsearch = index_engine.read_index(db, embeddings)
    if docsearch is not None:
        query = request.json.get('query', None)
        if query:
            docsearch.add_texts([query], [{'type': 'query'}])
            index_engine.write_index(db, docsearch)
            response = jsonify({"status": 'OK'})
            return response
        else:
            return make_response(jsonify({'error': 'No query provided'}), 400)
    else:
        return make_response(jsonify({'error': 'Cannot query without docsearch base'}), 500)
