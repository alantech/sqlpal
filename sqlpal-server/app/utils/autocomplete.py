import re
from langchain import HuggingFaceHub, OpenAI
from langchain.chat_models import ChatOpenAI
from langchain.chains import RetrievalQA
import os
from langchain.chains.question_answering import load_qa_chain
from langchain.chains.chat_vector_db.prompts import QA_PROMPT
from pglast import parse_sql, ast
from .validate import validate_select
import logging

logger = logging.getLogger(__name__)


CUSTOM_TEMPLATE = os.environ.get('AUTOCOMPLETE_PROMPT', """
You are an smart SQL assistant, capable of autocompleting SQL queries. You should autocomplete any queries with the specific guidelines:
- write a syntactically correct query using {dialect}
- unless the user specifies in his question a specific number of examples he wishes to obtain, do not limit the results. You can order the results by a relevant column to return the most interesting examples in the database.
- never query for all the columns from a specific table, only ask for a the few relevant columns given the question.
- pay attention to use only table names, columns and indexes that you can see in the schema description. Be careful to not query for columns that do not exist. Also, pay attention to which column is in which table and the data type of the columns.
- try to use SELECT, INSERT, UPDATE or DELETE operations depending on the desired action. Use JOIN or subselects to query information from different tables.
- do not give errors on best practices such as avoiding SELECT *.
- use comments on the query to try to figure out what the user is asking for, but do not reject the autocomplete if the comments are not perfect.
- remember it is an autocomplete, always prepend the fragment of the query to the generated output.

Example:

<<<
# generate a list of buckets in my region
SELECT i
>>>

Output: SELECT index, name FROM bucket WHERE region = 'us-east-1';

Please continue the query with the following input:

<<<
{input}
>>>

Output:
""")


def autocomplete_chat(query, docsearch):
    llm = ChatOpenAI(temperature=os.environ.get('TEMPERATURE', 0.9),
                     model_name=os.environ.get('LLM_MODEL', 'gpt-3.5-turbo'), n=os.environ.get('OPENAI_NUM_ANSWERS', 1))
    # for the autocomplete case, stuff is the only possible value
    chain = load_qa_chain(llm, chain_type="stuff", prompt=QA_PROMPT)

    # different search types
    if (os.environ.get('SEARCH_TYPE', 'similarity') == 'mmr'):
        docs = docsearch.max_marginal_relevance_search(
            query, k=os.environ.get('DOCS_TO_RETRIEVE', 5))
    else:
        docs = docsearch.similarity_search(
            query, k=os.environ.get('DOCS_TO_RETRIEVE', 5))
    query_str = CUSTOM_TEMPLATE.format(dialect="Postgres", input=query)

    res = chain(
        {"input_documents": docs, "question": query_str}, return_only_outputs=True
    )
    queries = re.split('; *\n', res["output_text"].strip())
    return queries


def autocomplete_retrieval(query, docsearch):
    llm = OpenAI(temperature=os.environ.get('TEMPERATURE', 0.9),
                 model_name=os.environ.get('LLM_MODEL', 'gpt-3.5-turbo'), n=os.environ.get('OPENAI_NUM_ANSWERS', 1))

    retriever = docsearch.as_retriever(search_type=os.environ.get(
        'SEARCH_TYPE', 'similarity'), search_kwargs={"k": os.environ.get('DOCS_TO_RETRIEVE', 5)})
    qa = RetrievalQA.from_chain_type(
        llm=llm, chain_type="stuff", retriever=retriever)
    query_str = CUSTOM_TEMPLATE.format(dialect="Postgres", input=query)
    res = qa({'query': query_str})
    queries = re.split('; *\n', res["result"].strip())
    return queries


def autocomplete_llm(query, docsearch):
    llm = OpenAI(temperature=os.environ.get('TEMPERATURE', 0.9),
                 model_name=os.environ.get('LLM_MODEL', 'gpt-3.5-turbo'), n=os.environ.get('OPENAI_NUM_ANSWERS', 1))

    # for the autocomplete case, stuff is the only possible value
    chain = load_qa_chain(llm, chain_type="stuff", prompt=QA_PROMPT)
    # different search types
    if (os.environ.get('SEARCH_TYPE', 'similarity') == 'mmr'):
        docs = docsearch.max_marginal_relevance_search(
            query, k=os.environ.get('DOCS_TO_RETRIEVE', 5))
    else:
        docs = docsearch.similarity_search(
            query, k=os.environ.get('DOCS_TO_RETRIEVE', 5))
    query_str = CUSTOM_TEMPLATE.format(dialect="Postgres", input=query)

    res = chain(
        {"input_documents": docs, "question": query_str}, return_only_outputs=True
    )
    queries = re.split('; *\n', res["output_text"].strip())
    return queries


def autocomplete_huggingface(query, docsearch):
    llm = HuggingFaceHub(repo_id=os.environ.get('LLM_MODEL', ''), model_kwargs={
                         "temperature": os.environ.get('TEMPERATURE', 0.9), "max_length": os.environ.get('HUGGINGFACE_MAX_TOKENS', 64)})
    chain = load_qa_chain(llm, chain_type="stuff", prompt=QA_PROMPT)
    # different search types
    if (os.environ.get('SEARCH_TYPE', 'similarity') == 'mmr'):
        docs = docsearch.max_marginal_relevance_search(
            query, k=os.environ.get('DOCS_TO_RETRIEVE', 5))
    else:
        docs = docsearch.similarity_search(
            query, k=os.environ.get('DOCS_TO_RETRIEVE', 5))
    query_str = CUSTOM_TEMPLATE.format(dialect="Postgres", input=query)

    res = chain(
        {"input_documents": docs, "question": query_str}, return_only_outputs=True
    )
    queries = re.split('; *\n', res["output_text"].strip())
    return queries


def autocomplete_query(query, docsearch, columns_by_table_dict):
    if os.environ.get('AUTOCOMPLETE_METHOD', 'chat') == 'chat':
        queries = autocomplete_chat(query, docsearch)
    elif os.environ.get('AUTOCOMPLETE_METHOD', 'chat') == 'retrieval':
        queries = autocomplete_retrieval(query, docsearch)
    elif os.environ.get('AUTOCOMPLETE_METHOD', 'chat') == 'llm':
        queries = autocomplete_llm(query, docsearch)
    elif os.environ.get('AUTOCOMPLETE_METHOD', 'chat') == 'huggingface':
        queries = autocomplete_huggingface(query, docsearch)
    else:
        queries = autocomplete_chat(query, docsearch)

    final_query = None
    for q in queries:
        try:
            parsed_query_stmt = parse_sql(q)
            is_valid = True
            # for s in [ st for st in parsed_query_stmt ]:
            for s in parsed_query_stmt:
                print('trying to validate')
                print(str(s))
                print(isinstance(s.stmt, ast.SelectStmt))
                if isinstance(s.stmt, ast.SelectStmt):
                    is_valid = validate_select(s.stmt, columns_by_table_dict)
                # elif isinstance(s, ast.InsertStmt):
                #     validate_insert(s)
                # elif isinstance(s, ast.UpdateStmt):
                #     validate_update(s)
                # elif isinstance(s, ast.DeleteStmt):
                #     validate_delete(s)
            if is_valid:
                print('VALID QUERY')
                final_query = q
                break
            print('NOT A VALID QUERY :(')

        except Exception as e:
            logger.exception(e)
    return final_query
