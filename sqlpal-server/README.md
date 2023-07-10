# Flask API with Autocomplete

This is a Flask API that provides autocomplete suggestions for SQL queries using `FAISS` for fast similarity search.

## Usage

The API has the following endpoints:

### `/discover`

This endpoint takes a connection string as a POST parameter and returns a 200 status code if the connection was successful. The connection string should be in the format specified by SQLAlchemy. Once the connection is established, the API will generate a vector index of the tables in the database using OpenAI's GPT-3 language model and FAISS for fast similarity search.

Example usage: `curl --request POST --url http://localhost:8088/discover --header 'content-type: multipart/form-data' --form conn_str=postgresql://user:password@localhost/mydatabase --form dialect='postgresql' --form schema={} --form table_info={}`

### `/autocomplete`

This endpoint takes an started SQL query as a POST parameter and returns a suggestion with the SQL query completed.

Example usage: `curl --request POST --url http://localhost:8088/autocomplete --header 'content-type: multipart/form-data' --form query='SELECT id' --form dialect='postgresql'`

### `/repair`

This endpoint takes an started SQL query as a POST parameter and returns a suggestion with the SQL query repaired.

Example usage: `curl --request POST --url http://localhost:8088/autocomplete --header 'content-type: multipart/form-data' --form error_message='Error near where. UNWANTED_TOKEN\nError near =. MISMATCHED_INPUT' --form query='SELECT id FROM WHERE name = 'foo';' --form dialect='postgresql'`

### `/add`

This endpoint takes a valid SQL query as a POST parameter and index it.

Example usage: `curl --request POST --url http://localhost:8088/autocomplete --header 'content-type: multipart/form-data' --form query='SELECT id FROM foo;'`

## License

This project is licensed under the AGPLv3 License - see the [LICENSE](LICENSE) file for details.
