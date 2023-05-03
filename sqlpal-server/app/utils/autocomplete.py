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

logger = logging.getLogger(__name__)
logging.basicConfig(stream=sys.stdout, level=logging.INFO)
logger.setLevel(logging.INFO)

CUSTOM_TEMPLATE = os.environ.get('AUTOCOMPLETE_PROMPT', """
You are an smart SQL assistant, capable of autocompleting SQL queries. You should autocomplete any queries with the specific guidelines:
- write a syntactically correct query using {dialect}
- unless the user specifies in his question a specific number of examples he wishes to obtain, do not limit the results. You can order the results by a relevant column to return the most interesting examples in the database
- never query for all the columns from a specific table, only ask for a the few relevant columns given the question
- start your query with one of the following keywords: SELECT, INSERT, UPDATE, or DELETE, depending on the desired action
- If you want to query multiple tables, use the JOIN keyword or subselects to join the tables together
- do not give errors on best practices such as avoiding SELECT *
- use comments on the query to try to figure out what the user is asking for, but do not reject the autocomplete if the comments are not perfect
- remember it is an autocomplete, always prepend the fragment of the query to the generated output.
- generate queries with real examples, not using placeholders
- end your query with a semicolon
- you only can use tables and columns defined in this schema and sample queries:

{table_info}

For example, a valid query might look like this:

SELECT name, age FROM users WHERE age > 30;

Please autocomplete the following SQL fragment: {query}

""")


def predict(llm, query, docsearch):
    # different search types
    if (os.environ.get('SEARCH_TYPE', 'similarity') == 'mmr'):
        docs = docsearch.max_marginal_relevance_search(
            query, k=int(os.environ.get('DOCS_TO_RETRIEVE', 5)))
    else:
        docs = docsearch.similarity_search(
            query, k=int(os.environ.get('DOCS_TO_RETRIEVE', 5)))

    # before using LLM we can check if docs already contain the query
    for doc in docs:
        if (doc.metadata['type'] == 'query' and doc.page_content):
            # Find the length of the common prefix
            common_prefix_length = 0
            for char1, char2 in zip(doc.page_content.strip(), query.strip()):
                if char1 != char2:
                    break
                common_prefix_length += 1

                if common_prefix_length >= 6:  # SELECT has 6 chars, minimum prefix needed
                    return doc.page_content

    #  no queries stored, go with llm
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
        # Check if line contains a SQL keyword
        pattern = r"(?i)\b(SELECT|INSERT|UPDATE|DELETE)\b"
        match = re.search(pattern, line)
        if match:
            index = match.start()
            line = line[index:]
            # find the pos of the query
            inside_query = True

        if inside_query:
            # Append line to current query
            current_query += ' ' + line

            # Check if query has a semicolon and get the position
            position = current_query.find(';')
            if position != -1:
                stripped_query = current_query[:position + 1]
                stripped_query = stripped_query.replace('\\', '')

                queries.append(stripped_query.strip())

                current_query = ''
                inside_query = False

    # If there is only one query and it is not multiline, add it to the list
    if current_query:
        # strip the query until ;
        position = current_query.find(';')
        if position != -1:
            stripped_query = current_query[:position + 1]
            stripped_query = stripped_query.replace('\\', '')

            queries.append(stripped_query.strip())

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
    query = prompt.format(query=query, table_info=docs, dialect='Postgres')

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
