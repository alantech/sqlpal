import logging
import re
import sys
import requests
from requests.auth import HTTPBasicAuth
from langchain import OpenAI, PromptTemplate, LLMChain
from langchain.chat_models import ChatOpenAI
import os
from langchain.chains.chat_vector_db.prompts import QA_PROMPT
from pglast import parse_sql, ast
from .validate import validate_select, validate_insert, validate_update, validate_delete
import logging

logger = logging.getLogger(__name__)
logging.basicConfig(stream=sys.stdout, level=logging.INFO)
logger.setLevel(logging.INFO)

CUSTOM_TEMPLATE = os.environ.get('AUTOCOMPLETE_PROMPT', """
You are an smart SQL assistant, capable of autocompleting SQL queries. You should autocomplete any queries with the specific guidelines:
- write a syntactically correct query using {dialect}
- unless the user specifies in his question a specific number of examples he wishes to obtain, do not limit the results. You can order the results by a relevant column to return the most interesting examples in the database.
- never query for all the columns from a specific table, only ask for a the few relevant columns given the question.
- if need to return a placeholder for a value, return it following the column data type.
- pay attention to use only table names, columns and indexes that you can see in the schema description. Be careful to not query for columns that do not exist. Also, pay attention to which column is in which table and the data type of the columns.
- try to use SELECT, INSERT, UPDATE or DELETE operations depending on the desired action. Use JOIN or subselects to query information from different tables.
- do not give errors on best practices such as avoiding SELECT *.
- use comments on the query to try to figure out what the user is asking for, but do not reject the autocomplete if the comments are not perfect.
- remember it is an autocomplete, always prepend the fragment of the query to the generated output.
- only use the following tables:

{table_info}

Example:

<<<
# generate a list of buckets in my region
SELECT i
>>>

Output: SELECT index, name FROM bucket WHERE region = 'us-east-1';

Please continue the query with the following input:

<<<
{query}
>>>

Output:
""")


def predict(llm, query, docsearch):
    # different search types
    if (os.environ.get('SEARCH_TYPE', 'similarity') == 'mmr'):
        docs = docsearch.max_marginal_relevance_search(
            query, k=int(os.environ.get('DOCS_TO_RETRIEVE', 5)))
    else:
        docs = docsearch.similarity_search(
            query, k=int(os.environ.get('DOCS_TO_RETRIEVE', 5)))

    prompt = PromptTemplate(
        input_variables=["query", "table_info", "dialect"], template=CUSTOM_TEMPLATE)
    llm_chain = LLMChain(llm=llm, prompt=prompt)
    res = llm_chain.predict(table_info=docs, query=query, dialect='Postgres')
    logger.info("Result from LLM: "+res)

    return res


def extract_queries_from_result(result):
    lines = result.split('\n')

    # Initialize list to store SQL queries
    queries = []

    # Initialize variables to track current query
    current_query = ''
    inside_query = False

    # Loop through each line
    for line in lines:
        # Check if line starts with a SQL keyword
        if re.match('^\s*(SELECT|INSERT|UPDATE|DELETE)', line, re.IGNORECASE):
            # Start a new query
            current_query = line
            inside_query = True
        # Check if inside a query
        elif inside_query:
            # Append line to current query
            current_query += ' ' + line

            # Check if query ends with semicolon
            if re.search(';\s*$', current_query):
                # Add query to list and reset variables
                queries.append(current_query.strip())
                current_query = ''
                inside_query = False

    # If there is only one query and it is not multiline, add it to the list
    if current_query and ';' in current_query:
        queries.append(current_query.strip())

    # Return list of SQL queries
    return queries


def autocomplete_chat(query, docsearch):
    llm = ChatOpenAI(temperature=os.environ.get('TEMPERATURE', 0.9),
                     model_name=os.environ.get('LLM_MODEL', 'gpt-3.5-turbo'), n=int(os.environ.get('OPENAI_NUM_ANSWERS', 1)))
    res = predict(llm, query, docsearch)
    final_queries = extract_queries_from_result(res)
    return final_queries


def autocomplete_openai(query, docsearch):
    llm = OpenAI(temperature=os.environ.get('TEMPERATURE', 0.9),
                 model_name=os.environ.get('LLM_MODEL', 'gpt-3.5-turbo'), n=int(os.environ.get('OPENAI_NUM_ANSWERS', 1)))
    res = predict(llm, query, docsearch)
    queries = re.split('; *\n', res.strip())
    return queries


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
    query = prompt.format(query=query, table_info=docs, dialect='Postgres')

    # issue a request to an external API
    request = {
        'prompt': query,
        'temperature': int(os.environ.get('TEMPERATURE', 1.3)),
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

            # cut the result on the first stopper
            try:
                index = result.index('###')
                result = result[:index].strip()
            except:
                pass

            final_queries = extract_queries_from_result(result)
            return final_queries
    except Exception as e:
        logger.exception("Error in autocomplete_selfhosted: "+e)

    return None


def autocomplete_query(query, docsearch, columns_by_table_dict):
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

    final_query = None
    for q in queries:
        try:
            parsed_query_stmt = parse_sql(q)
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
                final_query = q
                break

        except Exception as e:
            logger.exception(e)
    return final_query
