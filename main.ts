import { isURL } from "https://deno.land/x/is_url@v1.0.1/isURL.ts";
import imageType from "https://esm.sh/image-type@5.2.0";
import LRU from "npm:lru-cache";

const server = Deno.listen({ port: 8080 });

const cache = new LRU({
 max: 500,
 ttl: 60000,
});

type Image = {
 type: string;
 data: Uint8Array;
};

console.log(`HTTP webserver running.  Access it at:  http://localhost:8080/`);

for await (const conn of server) {
 serveHttp(conn).catch(console.error) as Promise<void>;
}

async function serveHttp(conn: Deno.Conn) {
 const httpConn = Deno.serveHttp(conn) as Deno.HttpConn;

 for await (const requestEvent of httpConn) {
  if (requestEvent.request.method !== "GET") {
   requestEvent.respondWith(new Response("Invaild method!", { status: 405 }));
   continue;
  }

  const url = new URL(requestEvent.request.url) as URL;
  const path = url.pathname as string;

  if (path !== "/") {
   requestEvent.respondWith(new Response("Not found", { status: 404 }));
   continue;
  }

  const urlParam = url.searchParams.get("url") as string;
  const isVaild = isURL(urlParam) as boolean;

  if (!isVaild) {
   requestEvent.respondWith(
    new Response("Invalid URL. Expected vaild url in query", {
     status: 400,
    }),
   );
   continue;
  }

  requestEvent.request.headers.get("Cache-Control") === "no-cache" && cache.delete(urlParam);
  const cachedImage = cache.get(urlParam) as Image;
  if (cachedImage) {
   const cacheResponse = new Response(cachedImage.data, {
    headers: {
     "Content-Type": cachedImage.type,
    },
    status: 200,
   }) as Response;
   requestEvent.respondWith(cacheResponse);
   continue;
  }

  try {
   const response = await fetch(urlParam, {
    method: "GET",
    headers: {
     "Content-Type": "image/*",
    },
   });

   if (!response || !response.ok || !response.body) return requestEvent.respondWith(new Response("Image not found on orgin server", { status: 400 }));
   const buffer = await response.arrayBuffer() as ArrayBuffer;
   if (!buffer) return requestEvent.respondWith(new Response("Provided url is not a image!", { status: 400 }));
   if (buffer.byteLength > 10000000) return requestEvent.respondWith(new Response("Image too large! Max image size is 10mb", { status: 400 }));

   const UArray = new Uint8Array(buffer) as Uint8Array;
   const image = await imageType(UArray) as { mime: string };
   if (!image) return requestEvent.respondWith(new Response("Provided url is not a image!", { status: 400 }));

   requestEvent.respondWith(
    new Response(buffer, {
     headers: {
      "Content-Type": image?.mime ?? "application/octet-stream",
     },
    }),
   );
   cache.set(urlParam, { type: image?.mime ?? "application/octet-stream", data: UArray });
  } catch (_) {
   requestEvent.respondWith(new Response("Image not found on orgin server", { status: 400 }));
  }
 }
}
