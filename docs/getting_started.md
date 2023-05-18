# Getting started

SQLPal is an open-source developer tool designed to be your pal for SQL, of course using LLM.

If you want to start using it, is as simple as cloning the app, and executing:

```
yarn docker-build
yarn docker-run
```

It will start a `docker-compose` deployment, with the dashboard and LLM engine on one side, and a testing database on the other.

To access the dashboard go to: http://localhost:9876
The db connection string for the testing database: postgres://sqlpaluser:sqlpass@local_pg:5432/sqlpal

The LLM engine allows multiple configuration parameters, that need to be provided via an `.env` file that needs to be placed on project root (see `.env.sample` file).
The following options are possible:

- OPENAI_API_KEY - key to consume OpenAI API
- OPENAI_AUTOCOMPLETE_MODEL - the model used for autocompletion in OpenAI: ada
- OPENAI_NUM_ANSWERS - the number of different answers that the system should suggest
- OPENAI_EMBEDDINGS_MODEL - https://platform.openai.com/docs/guides/embeddings/what-are-embeddings
- INDEX_FOLDER - path where to store the local persisted indexes. It is currently setup to a tmpfs volume, but could be modified to be persisting
- INDEX_ENGINE - FAISS, chroma
- USE_DATABASE - whether to store the index on the same db of the user or not. Only available for FAISS
- DOCS_TO_RETRIEVE - the number of total documents to retrieve from the index, to be part of the autocomplete
- EMBEDDING_METHOD - embedding engine used: openai, huggingface
- AUTOCOMPLETE_METHOD - chat (gpt-3.5-turbo), openai (generic openai models such as text-davinci-003), selfhosted
- AUTOCOMPLETE_PROMPT - custom prompt to pass to the system to generate the autocomplete
- TEMPERATURE - the temperature for getting the autocomplete. Decimal between 0 and 1
- SEARCH_TYPE - type of search to use: similarity, mmr
- LLM_HOST - the host with the LLM API
- LLM_USER - the name to auth into the LLM API
- LLM_PASSWORD - the password using to authenticate
