import re
from langchain import OpenAI, PromptTemplate, LLMChain
from langchain.chat_models import ChatOpenAI
import os
from langchain.chains.chat_vector_db.prompts import QA_PROMPT
from pglast import parse_sql, ast
from .validate import validate_select, validate_insert, validate_update, validate_delete
import logging

logger = logging.getLogger(__name__)


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
    return res


def autocomplete_chat(query, docsearch):
    llm = ChatOpenAI(temperature=os.environ.get('TEMPERATURE', 0.9),
                     model_name=os.environ.get('LLM_MODEL', 'gpt-3.5-turbo'), n=int(os.environ.get('OPENAI_NUM_ANSWERS', 1)))
    res = predict(llm, query, docsearch)
    queries = re.split('; *\n', res.strip())
    return queries


def autocomplete_openai(query, docsearch):
    llm = OpenAI(temperature=os.environ.get('TEMPERATURE', 0.9),
                 model_name=os.environ.get('LLM_MODEL', 'gpt-3.5-turbo'), n=int(os.environ.get('OPENAI_NUM_ANSWERS', 1)))
    res = predict(llm, query, docsearch)
    queries = re.split('; *\n', res.strip())
    return queries


def autocomplete_huggingface(query, docsearch):
    gpu = rh.cluster(ips=[os.environ.get('SSH_HOST', '')],
                     ssh_creds={'ssh_user': os.environ.get(
                         'SSH_USER', ''), 'ssh_private_key': os.environ.get('SSH_PRIVATE_KEY', '')},
                     name='llm_host').save()

    llm = SelfHostedHuggingFaceLLM(model_id=os.environ.get('LLM_MODEL', ''), hardware=gpu, model_reqs=[
                                   "pip:./", "transformers", "torch"], task="text2text-generation",)
    res = predict(llm, query, docsearch)
    queries = re.split('; *\n', res.strip())
    return queries


def autocomplete_llama(query, docsearch):
    llm = LlamaCpp(model_path=os.environ.get('LLM_MODEL', ''), n_ctx=4096)
    res = predict(llm, query, docsearch)
    queries = re.split('; *\n', res.strip())
    return queries


def autocomplete_query(query, docsearch, columns_by_table_dict):
    if os.environ.get('AUTOCOMPLETE_METHOD', 'chat') == 'chat':
        queries = autocomplete_chat(query, docsearch)
    elif os.environ.get('AUTOCOMPLETE_METHOD', 'chat') == 'openai':
        queries = autocomplete_openai(query, docsearch)
    elif os.environ.get('AUTOCOMPLETE_METHOD', 'chat') == 'huggingface':
        queries = autocomplete_huggingface(query, docsearch)
    elif os.environ.get('AUTOCOMPLETE_METHOD', 'chat') == 'llama':
        queries = autocomplete_llama(query, docsearch)
    else:
        queries = autocomplete_chat(query, docsearch)

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
