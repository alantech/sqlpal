<div style="text-align:center"><img src="editor/assets/icons/64x64.png" /></div>

# SQLPAL

SQLPal is an open-source SQL editor designed to save you time when writing SQL for complex or unfamiliar schemas by using OpenAI's LLMs. It is composed of an `editor` web app in React that runs in a desktop app via Electron and communicates via a Flask `server` that actually computes the suggestions using `FAISS` and OpenAI models.

It will guide and help you when writing SQL, from performing suggestions and highlighting and suggesting corrections for bad syntax. All of that taking into account the connected database schema.

## ⚡️ Try out SQLPAL

If you want to start using it, is as simple as cloning the repository, and executing:

```sh
yarn docker-build
yarn docker-run
```

It will start a `docker-compose` deployment, with the LLM engine on one side, and some testing databases.

> Note: Make sure to create a `.env` file following the `.env.sample`

To start the SQLPal desktop app:

```sh
cd editor
npm install
npm start
```

> Warning: If it is the first time, sometimes you have to run `npm start`, the app will fail loading preload.js script, just cancel and run `npm start` again

## Configuration

The LLM engine allows multiple configuration parameters, that need to be provided via an `.env` file that needs to be placed on project root (see `.env.sample` file).
The following options are possible:

- OPENAI_API_KEY - key to consume OpenAI API.
- AUTOCOMPLETE_METHOD - Method to interact with API. `chat` | `selfhosted`. Default: `chat`.
- LLM_MODEL - Model used for autocompletion when interacting with OpenAI. https://platform.openai.com/docs/models.
- AUTOCOMPLETE_PROMPT - custom prompt to pass to the system to generate the autocomplete.
- INDEX_FOLDER - path where to store the local persisted indexes. It is currently setup to a tmpfs volume, but could be modified to be persisting.
- INDEX_ENGINE - `FAISS`. `chroma` could be used but need to be added to the `requirements.txt`.
- USE_DATABASE - whether to store the index on the db or not. Only available for `FAISS`.
- POSTGRES_USER - pg user of the database storing the indices.
- POSTGRES_PASSWORD - pg password of the database storing the indices.
- POSTGRES_DB - pg name of the database storing the indices.
- GET_SAMPLE_QUERIES - whether to generate a set of sample queries based on the schema of the database. This would help finding suggestions.
- QUERIES_METHOD - method used to generate the sample queries. `chat` | `selfhosted`. Default: `chat`.
- LLM_QUERIES_MODEL - model used to generate sample queries based on the schema.
- REPAIR_METHOD - method used to generate suggestions to correct queries. `chat` | `selfhosted`. Default: `chat`.
- REPAIR_MODEL - model used to generate suggestions to correct queries.
- TEMPERATURE - the temperature for getting the autocomplete.
- OPENAI_NUM_ANSWERS - the number of different answers that the system should suggest.
- DOCS_TO_RETRIEVE - the number of total documents to retrieve from the index, to be part of the autocomplete.
- SEARCH_TYPE - type of search to use. `similarity` | `mmr`.
- LLM_HOST - the host with the LLM API
- LLM_USER - the name to auth into the LLM API
- LLM_PASSWORD - the password using to authenticate
- EMBEDDING_METHOD - embedding engine used. `openai` | `huggingface`
- OPENAI_EMBEDDINGS_MODEL - embedding model https://platform.openai.com/docs/guides/embeddings/what-are-embeddings.

## Testing databases

The database connection strings for the testing databases are:

- Postgres: `postgresql://sqlpaluser:sqlpass@localhost:5432/sqlpal`
- MySQL: `mysql://sqlpaluser:sqlpass@localhost:3306/sqlpal`
- MSSQL: `mssql://sqlpaluser:sqlpass@localhost:1433/sqlpal?TrustServerCertificate=yes`
