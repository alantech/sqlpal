async function maybeHandleFetchError(response: any) {
  // TODO: What type here?
  if (!response.ok) {
    let message;
    try {
      message = await response.text();
    } catch (e) {
      message = `HTTP error code ${response.status}`;
    }
    try {
      const jsonEncodedError = JSON.parse(message).message;
      if (!!jsonEncodedError) message = jsonEncodedError;
    } catch (_) {
      // Nothing to do here
    }
    throw new Error(`Error: ${message}`);
  }
}

async function redirectIfUnauthorized(response: any) {
  if (response.status === 403) {
    const obj = await response.json();
    if (obj.paymentLink) window.location.href = obj.paymentLink;
  }
}

async function post(backendUrl: string, endpoint: string, body: any, raw = false) {
  const resp = await fetch(`${backendUrl}/${endpoint}`, {
    method: 'POST',
    body: raw ? body : JSON.stringify(body),
    headers: {
      'Content-Type': raw ? 'text/plain' : 'application/json',
    },
  });
  await redirectIfUnauthorized(resp);
  await maybeHandleFetchError(resp);
  return resp;
}

export async function run(backendUrl: string, connString: string, sql: string, dialect: string) {
  const resp = await post(backendUrl, '', { sql, connString, dialect });
  return resp.json();
}

export async function autocomplete(backendUrl: string, connString: string, sql: string) {
  const resp = await post(backendUrl, 'autocomplete', { query: sql, conn_str: connString });
  return resp.json();
}

export async function discoverData(backendUrl: string, connString: string) {
  const resp = await post(backendUrl, 'discover', { conn_str: connString });
  return resp.json();
}

export async function repair(backendUrl: string, connString: string, query: string, error: string) {
  const resp = await post(backendUrl, 'repair', { conn_str: connString, query: query, error_message: error });
  return resp.json();
}

export async function addStatement(backendUrl: string, connString: string, query: string) {
  const resp = await post(backendUrl, 'add', { query, conn_str: connString });
  return resp.json();
}
