import logging
import re
import sys
import requests
from requests.auth import HTTPBasicAuth
from langchain import PromptTemplate, LLMChain
from langchain.chat_models import ChatOpenAI
from langchain.llms import OpenAI
import os
from langchain.chains.chat_vector_db.prompts import QA_PROMPT
from pglast import parse_sql, ast
from .validate import validate_select, validate_insert, validate_update, validate_delete
import logging
from difflib import SequenceMatcher

logger = logging.getLogger(__name__)
logging.basicConfig(stream=sys.stdout, level=logging.INFO)
logger.setLevel(logging.INFO)

CUSTOM_TEMPLATE = os.environ.get('AUTOCOMPLETE_PROMPT', """
You are an smart SQL assistant, capable of generating SQL queries based on comments or hints. You should generate any queries with the specific guidelines:
- write a syntactically correct query using {dialect}
- start your query with one of the following keywords: SELECT, INSERT, UPDATE, or DELETE, or any other {dialect} valid command
- do not fancy format the query with newlines or tabs, just return the raw query
- if you want to query multiple tables, use the JOIN keyword or subselects to join the tables together
- use tables and columns from the provided schema to generate the valid result from the provided hints
- always return the complete valid SQL query, not just fragments
- always generate valid queries including columns and tables from the schema
- do not include any comments in the query, just the query itself
- generate queries with real examples, not using placeholders
- end your query with a semicolon
- only show the totally completed final query, without any additional output
- if you cannot generate the result return an empty string, do not show any other content
- you only can use tables and columns defined in this schema:

{table_info}

For example, a valid query might look like this:

SELECT name, age FROM users WHERE age > 30;

Please generate the complete SQL query based on this hint: {query}

""")

SAMPLE_QUERIES_TEMPLATE = os.environ.get('SAMPLE_QUERIES_PROMPT', """
You are an SQL assistant, capable of generating valid SQL queries. Your goal is to read data from a table and generate relevant example queries that can be used for testing.
The queries need to cover the whole range of SQL language, including SELECT, INSERT, UPDATE and DELETE, using relevant columns from the table.
Use the following premises:
- write a syntactically correct query using {dialect}
- generate queries with real examples, not using placeholders
- end your query with a semicolon

Generate a list of 15 queries based on this table:

{table_info}

The output needs to be just a JSON list with this format:
[
"query1",
"query2",
"query3"
]

Only provide this list without any additional output.
""")

MAX_SIMILARITY_RATIO=0.55

def predict(llm, query, docsearch):
    # different search types
    if (os.environ.get('SEARCH_TYPE', 'similarity') == 'mmr'):
        docs = docsearch.max_marginal_relevance_search(
            query, k=int(os.environ.get('DOCS_TO_RETRIEVE', 5)))
    else:
        docs = docsearch.similarity_search(
            query, k=int(os.environ.get('DOCS_TO_RETRIEVE', 5)))

    for doc in docs:
        if (doc.metadata['type'] == 'query' and doc.page_content):
            # Find the length of the common prefix
            common_prefix_length = 0
            for char1, char2 in zip(doc.page_content.strip(), query.strip()):
                if char1 != char2:
                    break
                common_prefix_length += 1

                if common_prefix_length >= 6:
                    # if it is very similar we return it
                    s = SequenceMatcher(None, query, doc.page_content)
                    if s.ratio() > MAX_SIMILARITY_RATIO:
                        # very similar, will match
                        return doc.page_content

    #  no queries stored, go with llm
    prompt = PromptTemplate(
        input_variables=["query", "table_info", "dialect"], template=CUSTOM_TEMPLATE)
    llm_chain = LLMChain(llm=llm, prompt=prompt)
    res = llm_chain.predict(table_info=docs, query=query, dialect='PostgreSQL')
    logger.info("Result from LLM: "+res)

    return res


def extract_queries_from_result(result):
    # transform newlines to spaces, and trim
    result = re.sub(r'\n', ' ', result)
    return [result.strip()]


def autocomplete_chat(query, docsearch):
    llm = ChatOpenAI(temperature=os.environ.get('TEMPERATURE', 0.9),
                     model_name=os.environ.get('LLM_MODEL', 'gpt-3.5-turbo'), n=int(os.environ.get('OPENAI_NUM_ANSWERS', 1)))
    res = predict(llm, query, docsearch)
    final_queries = extract_queries_from_result(res)
    return final_queries


def autocomplete_openai(query, docsearch):
    llm = OpenAI(temperature=os.environ.get('TEMPERATURE', 0.9),
                 model_name=os.environ.get('LLM_MODEL', 'text-davinci-002'), n=int(os.environ.get('OPENAI_NUM_ANSWERS', 1)))
    res = predict(llm, query, docsearch)
    final_queries = extract_queries_from_result(res)
    return final_queries


def autocomplete_selfhosted(query, docsearch):
    # different search types
    if (os.environ.get('SEARCH_TYPE', 'similarity') == 'mmr'):
        docs = docsearch.max_marginal_relevance_search(
            query, k=int(os.environ.get('DOCS_TO_RETRIEVE', 5)))
    else:
        docs = docsearch.similarity_search(
            query, k=int(os.environ.get('DOCS_TO_RETRIEVE', 5)))

    prompt = PromptTemplate(
        input_variables=["query", "table_info", "dialect"], template=CUSTOM_TEMPLATE)
    query = prompt.format(query=query, table_info=docs, dialect='PostgreSQL')

    # issue a request to an external API
    request = {
        'prompt': query,
        'temperature': float(os.environ.get('TEMPERATURE', 1.3)),
        'top_p': 0.1,
        'typical_p': 1,
        'repetition_penalty': 1.18,
        'top_k': 40,
        'min_length': 0,
        'no_repeat_ngram_size': 0,
        'num_beams': 1,
        'penalty_alpha': 0,
        'length_penalty': 1,
        'early_stopping': False,
        'seed': -1,
        'add_bos_token': True,
        'truncation_length': 2048,
        'ban_eos_token': False,
        'skip_special_tokens': True,
        'stopping_strings': []
    }

    try:
        response = requests.post(os.environ.get('LLM_HOST', ''), json=request, auth=HTTPBasicAuth(
            os.environ.get('LLM_USER', ''), os.environ.get('LLM_PASSWORD', '')))
        if response.status_code == 200:
            result = response.json()['results'][0]['text']
            logger.info("Result from LLM: "+result)
            final_queries = extract_queries_from_result(result)
            return final_queries
    except Exception as e:
        logger.exception("Error in autocomplete_selfhosted: "+e)

    return None


def autocomplete_query_suggestions(query, docsearch):
    if os.environ.get('AUTOCOMPLETE_METHOD', 'chat') == 'chat':
        queries = autocomplete_chat(query, docsearch)
    elif os.environ.get('AUTOCOMPLETE_METHOD', 'chat') == 'openai':
        queries = autocomplete_openai(query, docsearch)
    elif os.environ.get('AUTOCOMPLETE_METHOD', 'chat') == 'selfhosted':
        queries = autocomplete_selfhosted(query, docsearch)
    else:
        queries = autocomplete_chat(query, docsearch)
    logger.info("Returned queries are: ")
    logger.info(queries)
    return queries


def predict_queries(llm, schema):
    prompt = PromptTemplate(
        input_variables=["table_info", "dialect"], template=SAMPLE_QUERIES_TEMPLATE)
    llm_chain = LLMChain(llm=llm, prompt=prompt)
    res = llm_chain.predict(dialect='PostgreSQL', table_info=schema)
    logger.info("Result from LLM: "+res)

    return res


def queries_chat(schema):
    llm = ChatOpenAI(temperature=os.environ.get('TEMPERATURE', 0.9),
                     model_name=os.environ.get('LLM_QUERIES_MODEL', 'gpt-3.5-turbo'), n=1)
    res = predict_queries(llm, schema)
    final_queries = extract_queries_from_result(res)
    return final_queries


def queries_openai(schema):
    llm = OpenAI(temperature=os.environ.get('TEMPERATURE', 0.9),
                 model_name=os.environ.get('LLM_QUERIES_MODEL', 'text-davinci-002'), n=1)
    res = predict_queries(llm, schema)
    final_queries = extract_queries_from_result(res)
    return final_queries


def queries_selfhosted(schema):
    prompt = PromptTemplate(
        input_variables=["table_info", "dialect"], template=SAMPLE_QUERIES_TEMPLATE)
    query = prompt.format(table_info=schema, dialect='PostgreSQL')

    # issue a request to an external API
    request = {
        'prompt': query,
        'temperature': float(os.environ.get('TEMPERATURE', 1.3)),
        'top_p': 0.1,
        'typical_p': 1,
        'repetition_penalty': 1.18,
        'top_k': 40,
        'min_length': 0,
        'no_repeat_ngram_size': 0,
        'num_beams': 1,
        'penalty_alpha': 0,
        'length_penalty': 1,
        'early_stopping': False,
        'seed': -1,
        'add_bos_token': True,
        'truncation_length': 2048,
        'ban_eos_token': False,
        'skip_special_tokens': True,
        'stopping_strings': []
    }

    try:
        response = requests.post(os.environ.get('LLM_HOST', ''), json=request, auth=HTTPBasicAuth(
            os.environ.get('LLM_USER', ''), os.environ.get('LLM_PASSWORD', '')))
        if response.status_code == 200:
            result = response.json()['results'][0]['text']
            logger.info("Result from LLM: "+result)
            final_queries = extract_queries_from_result(result)
            return final_queries
    except Exception as e:
        logger.exception("Error in autocomplete_selfhosted: "+e)

    return None


def generate_queries_for_schema(schema, columns_by_table_dict):
    if os.environ.get('QUERIES_METHOD', 'chat') == 'chat':
        queries = queries_chat(schema)
    elif os.environ.get('QUERIES_METHOD', 'chat') == 'openai':
        queries = queries_openai(schema)
    elif os.environ.get('QUERIES_METHOD', 'chat') == 'selfhosted':
        queries = queries_selfhosted(schema)
    else:
        queries = queries_chat(schema)

    # validate all queries and return only the accepted ones
    final_queries = []
    for q in queries:
        try:
            parsed_query_stmt = parse_sql(q.replace('"', ''))
            is_valid = True
            for s in parsed_query_stmt:
                stmt = s.stmt
                if isinstance(stmt, ast.SelectStmt):
                    is_valid = validate_select(stmt, columns_by_table_dict)
                elif isinstance(stmt, ast.InsertStmt):
                    is_valid = validate_insert(stmt, columns_by_table_dict)
                elif isinstance(stmt, ast.UpdateStmt):
                    is_valid = validate_update(stmt, columns_by_table_dict)
                elif isinstance(stmt, ast.DeleteStmt):
                    is_valid = validate_delete(stmt, columns_by_table_dict)
            if is_valid:
                final_queries.append(q)

        except Exception as e:
            logger.info("Query not valid: "+q)
    return final_queries
