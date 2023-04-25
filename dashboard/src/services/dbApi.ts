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

export async function run(backendUrl: string, connString: string, sql: string) {
  const resp = await post(backendUrl, '', { sql, connString });
  return resp.json();
}
