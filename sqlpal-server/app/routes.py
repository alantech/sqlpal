from flask import Blueprint, Flask, jsonify, make_response, request
from flask_cors import CORS, cross_origin
from dotenv import load_dotenv
import os
import openai
from .utils.embeddings import select_embeddings
from .utils.autocomplete import autocomplete_query, generate_queries_for_schema
from .utils.indexes import select_index

from .utils import connect_to_db, get_db_columns_by_table
import logging

logger = logging.getLogger(__name__)

api_bp = Blueprint('api_bp', __name__)
app = Flask(__name__)
CORS(app, resources={
     r"/*": {"origins": "http://localhost:9876", "supports_credentials": True}})
app.config['CORS_HEADERS'] = 'Content-Type'

load_dotenv()
openai.api_key = os.environ.get('OPENAI_API_KEY')


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
    columns_by_table_dict = get_db_columns_by_table(db)
    for table in tables:
        info = db.get_table_info(table_names=[table])
        info = info.replace('\t', ' ').replace('\n', ' ')
        texts.append(info)
        metadatas.append({'type': 'schema'})

        if os.environ.get('GET_SAMPLE_QUERIES', False):
            queries = generate_queries_for_schema(info, columns_by_table_dict)
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

    db, error = connect_to_db(request)
    if error:
        return error

    index_engine = select_index()

    embeddings = select_embeddings()
    docsearch = index_engine.read_index(db, embeddings)
    columns_by_table_dict = get_db_columns_by_table(db)
    if docsearch is not None:
        query = request.json.get('query', None)
        if query:
            # execute query autocompletion
            result = autocomplete_query(
                query, docsearch, columns_by_table_dict)
            response = jsonify({'output_text': result})
            return response
        else:
            return make_response(jsonify({'error': 'No query provided'}), 400)
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
