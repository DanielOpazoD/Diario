"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/storage-proxy.ts
var storage_proxy_exports = {};
__export(storage_proxy_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(storage_proxy_exports);
var handler = async (event) => {
  try {
    const url = event.queryStringParameters?.url;
    if (!url) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing url" }) };
    }
    const response = await fetch(url);
    if (!response.ok) {
      return { statusCode: response.status, body: JSON.stringify({ error: "Failed to fetch file" }) };
    }
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const buffer = Buffer.from(await response.arrayBuffer());
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mimeType: contentType,
        base64: buffer.toString("base64")
      })
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error?.message || "Proxy error" }) };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
