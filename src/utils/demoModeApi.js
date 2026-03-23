const DEMO_STORE_KEY = "cp_demo_api_store_v1";

const ENDPOINT_DEFAULT = {
  settings: "settings.php",
};

function toJson(text) {
  if (!text) return null;
  const cleaned = text.replace(/^\uFEFF/, "").trim();
  if (!cleaned) return null;
  return JSON.parse(cleaned);
}

function getStore() {
  try {
    return JSON.parse(sessionStorage.getItem(DEMO_STORE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveStore(store) {
  sessionStorage.setItem(DEMO_STORE_KEY, JSON.stringify(store));
}

function responseJson(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function parseEndpoint(url) {
  try {
    const parsed = new URL(url, window.location.origin);
    const path = parsed.pathname || "";
    const endpoint = path.split("/").pop() || "";
    return { endpoint, parsed };
  } catch {
    return { endpoint: "", parsed: null };
  }
}

function ensureArrayData(data) {
  if (Array.isArray(data)) return data;
  return [];
}

function getNextId(items) {
  const maxId = items.reduce((max, item) => Math.max(max, Number(item?.id || 0)), 0);
  return maxId + 1;
}

async function loadBaseData(endpoint, originalFetch, headers) {
  const baseRes = await originalFetch(`/api/${endpoint}`, {
    method: "GET",
    headers,
  });
  const baseText = await baseRes.text();
  const baseJson = toJson(baseText);
  if (!baseJson || baseJson.status !== "success") {
    return endpoint === ENDPOINT_DEFAULT.settings ? {} : [];
  }
  return baseJson.data;
}

function parseJsonBody(init) {
  if (!init?.body) return null;
  if (typeof init.body === "string") {
    try {
      return JSON.parse(init.body);
    } catch {
      return null;
    }
  }
  return null;
}

function extractIdsForDelete(parsedUrl, init) {
  const ids = [];
  const queryId = parsedUrl?.searchParams?.get("id");
  if (queryId) ids.push(Number(queryId));
  const bodyJson = parseJsonBody(init);
  if (bodyJson?.id) ids.push(Number(bodyJson.id));
  if (Array.isArray(bodyJson?.ids)) {
    bodyJson.ids.forEach((id) => ids.push(Number(id)));
  }
  return ids.filter((id) => Number.isFinite(id) && id > 0);
}

function applyArrayWrite(items, method, payload, deleteIds) {
  const list = ensureArrayData(items);

  if (method === "DELETE") {
    if (!deleteIds.length) return list;
    return list.filter((item) => !deleteIds.includes(Number(item?.id)));
  }

  const nextPayload = payload || {};
  const id = Number(nextPayload.id || 0);

  if (id > 0) {
    let found = false;
    const updated = list.map((item) => {
      if (Number(item?.id) !== id) return item;
      found = true;
      return { ...item, ...nextPayload };
    });
    if (found) return updated;
  }

  return [{ ...nextPayload, id: getNextId(list) }, ...list];
}

function buildGetPayload(endpoint, data, parsedUrl) {
  if (endpoint === "media.php") {
    const page = Math.max(1, Number(parsedUrl?.searchParams?.get("page") || 1));
    const limit = Math.max(1, Number(parsedUrl?.searchParams?.get("limit") || 20));
    const type = parsedUrl?.searchParams?.get("type");
    let items = ensureArrayData(data);
    if (type) {
      items = items.filter((item) => item?.type === type || item?.file_type === type);
    }
    const offset = (page - 1) * limit;
    const paged = items.slice(offset, offset + limit);
    return {
      status: "success",
      data: paged,
      pagination: {
        page,
        limit,
        total: items.length,
        has_more: offset + limit < items.length,
      },
    };
  }

  return { status: "success", data };
}

export async function handleReadOnlyDemoRequest({
  url,
  init,
  originalFetch,
  authToken,
}) {
  const method = (init?.method || "GET").toUpperCase();
  const { endpoint, parsed } = parseEndpoint(url);
  if (!endpoint.endsWith(".php")) return null;

  const headers = new Headers(init?.headers || {});
  headers.set("Authorization", `Bearer ${authToken}`);

  const store = getStore();
  let localData = store[endpoint];

  if (method === "GET") {
    if (localData === undefined) return null;
    return responseJson(buildGetPayload(endpoint, localData, parsed));
  }

  if (localData === undefined) {
    localData = await loadBaseData(endpoint, originalFetch, headers);
  }

  if (endpoint === ENDPOINT_DEFAULT.settings) {
    const payload = parseJsonBody(init) || {};
    store[endpoint] = { ...localData, ...payload };
    saveStore(store);
    return responseJson({
      status: "success",
      message: "Mode demo: perubahan pengaturan disimpan lokal.",
    });
  }

  if (init?.body instanceof FormData) {
    const form = init.body;
    const filename = form.get("fileName") || form.get("name") || "demo-file";
    const methodData = ensureArrayData(localData);
    const created = {
      id: getNextId(methodData),
      name: filename,
      type: endpoint === "media.php" ? "document" : "document",
      url: "#demo-local",
    };
    store[endpoint] = [created, ...methodData];
    saveStore(store);
    return responseJson({
      status: endpoint === "media.php" && form.get("chunk") ? "chunk_received" : "success",
      data: created,
      message: "Mode demo: file dicatat lokal (tidak diunggah ke server).",
    });
  }

  const payload = parseJsonBody(init);
  const deleteIds = extractIdsForDelete(parsed, init);
  const nextData = applyArrayWrite(localData, method, payload, deleteIds);
  store[endpoint] = nextData;
  saveStore(store);

  return responseJson({
    status: "success",
    message: "Mode demo: perubahan disimpan lokal (session).",
    data: payload || null,
  });
}

export function clearReadOnlyDemoStore() {
  sessionStorage.removeItem(DEMO_STORE_KEY);
}
