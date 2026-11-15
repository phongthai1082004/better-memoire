import { createServer } from "node:http";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const OUTPUT = process.env.RESEND_MAILBOX ?? "../.screens/last-resend.json";
const PORT = Number(process.env.RESEND_MOCK_PORT ?? 5333);

mkdirSync(dirname(OUTPUT), { recursive: true });

const server = createServer((request, response) => {
  if (request.method !== "POST" || request.url !== "/emails") {
    response.statusCode = 404;
    response.end("{}");
    return;
  }

  let body = "";
  request.on("data", (chunk) => (body += chunk));
  request.on("end", () => {
    writeFileSync(OUTPUT, body, "utf8");
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ id: "mock-email-id" }));
  });
});

server.listen(PORT, () => {
  console.log(`mock Resend listening on ${PORT}, writing ${OUTPUT}`);
});
