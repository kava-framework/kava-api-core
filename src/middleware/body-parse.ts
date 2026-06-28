import { Elysia, status } from 'elysia'
import { logger } from '@utils'
import { errors } from './middleware'

export const BodyParse = (app: Elysia) => app.state<{ rawBody?: any }>({}).onRequest(async ({ request, store }) => {
  const text = await request.clone().text();

  const contentType = request.headers.get("content-type") || "";
  let rawBody: any = {};

  try {
    if (contentType.includes("application/json")) {
      rawBody = text ? JSON.parse(text) : {};
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const params = new URLSearchParams(text);
      for (const [key, value] of params.entries()) bodyParseNestedSet(rawBody, key, value);
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await request.clone().formData();
      for (const [key, value] of formData.entries()) bodyParseNestedSet(rawBody, key, value);
    } else {
      rawBody = {};
    }
  } catch (e) {
    const em = e instanceof Error ? e.message : String(e)
    logger.error(`Body parse error: ${em}`, { error: em })
    rawBody = {};
    throw status(errors.request.status, { message: errors.request.message })
  }

  store.rawBody = rawBody;
}).derive(({ store }) => {
  const payload = bodyParseKeyFormat(store.rawBody || {});
  return { payload };
})

function bodyParseKeyFormat(input: any): any {
  if ( typeof input !== "object" || input === null || input instanceof File ) return input;

  if (Array.isArray(input)) return input.map(bodyParseKeyFormat)

  const result: any = {}
  for (const [key, value] of Object.entries(input)) {
    if (key.includes(".") || key.includes("[")) {
      bodyParseNestedSet(result, key, bodyParseKeyFormat(value))
    } else {
      result[key] = bodyParseKeyFormat(value)
    }
  }
  return result
}

function bodyParseNestedSet(obj: any, path: string, value: any) {
  const parts = bodyParsePathFormat(path);
  let current = obj;

  for (let i = 0; i < parts.length; i++) {
    const key = parts[i];
    const isLast = i === parts.length - 1;

    if (isLast) {
      current[key] = bodyParseValueFormat(value);
    } else {
      if (!(key in current)) {
        const nextKey = parts[i + 1];
        current[key] = isNaN(Number(nextKey)) ? {} : [];
      }
      current = current[key];
    }
  }
}

function bodyParsePathFormat(path: string): string[] {
  return path.replace(/\[(\w+)\]/g, ".$1").replace(/^\./, "").split(".");
}

function bodyParseValueFormat(value: any) {
  if (value == "" || value == null || value == "null") return null;
  if (typeof value !== "string") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  if (!isNaN(Number(value))) return Number(value);
  return value;
}
