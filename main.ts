import { isURL } from "https://deno.land/x/is_url@v1.0.1/isURL.ts";
import imageType from "https://esm.sh/image-type@5.2.0";
import { LRUCache } from "https://esm.sh/lru-cache@10.0.2";
import { ImageMagick, IMagickImage, initialize, MagickGeometry } from "https://deno.land/x/imagemagick_deno@0.0.26/mod.ts";

const server = Deno.listen({ port: 8080 });

const cache = new LRUCache({
 max: 500,
 ttl: 60000,
});

type Image = {
 type: string;
 data: Uint8Array;
};

console.log(`HTTP webserver running. Access it at: http://localhost:8080/`);

await initialize();

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

  requestEvent.request.headers.get("Cache-Control") === "no-cache" && cache.delete(url.searchParams.toString());
  const cachedImage = cache.get(url.searchParams.toString()) as Image;

  if (cachedImage) {
   requestEvent.respondWith(
    new Response(cachedImage.data, {
     headers: {
      "Content-Type": cachedImage.type,
     },
     status: 200,
    }),
   );
   continue;
  }

  try {
   const response = await fetch(urlParam, {
    method: "GET",
    headers: {
     "Content-Type": "image/*",
    },
   });

   if (!response || !response.ok || !response.body) {
    return requestEvent.respondWith(new Response("Image not found on origin server", { status: 400 }));
   }

   const buffer = await response.arrayBuffer();
   if (!buffer) {
    return requestEvent.respondWith(new Response("Provided URL is not an image!", { status: 400 }));
   }

   if (buffer.byteLength > 10000000) {
    return requestEvent.respondWith(new Response("Image is too large! Max image size is 10MB", { status: 400 }));
   }

   const UArray = new Uint8Array(buffer);
   const image = await imageType(UArray);

   if (!image) {
    return requestEvent.respondWith(new Response("Provided URL is not an image!", { status: 400 }));
   }

   const height = Number(url.searchParams.get("height")) || 0;
   const width = Number(url.searchParams.get("width")) || 0;
   const quality = Number(url.searchParams.get("quality")) || 100;

   if (height && width) {
    if (height < 0 || width < 0 || height > 2160 || width > 2160) {
     return requestEvent.respondWith(new Response("Height and width must be between 0 and 2160", { status: 400 }));
    }

    if ((quality && quality < 1) || quality > 100) {
     return requestEvent.respondWith(new Response("Quality must be between 1 and 100", { status: 400 }));
    }

    const sizingData = new MagickGeometry(width, height) as MagickGeometry;
    sizingData.ignoreAspectRatio = height > 0 && width > 0;

    const resizedImage = (await new Promise((resolve) => {
     ImageMagick.read(UArray, (image: IMagickImage) => {
      image.quality = quality;
      image.resize(sizingData);
      image.write((data: Uint8Array) => resolve(data));
     });
    })) as Uint8Array;

    requestEvent.respondWith(
     new Response(resizedImage, {
      headers: {
       "Content-Type": image.mime || "application/octet-stream",
       "Cache-Control": "public, max-age=31536000",
      },
     }),
    );

    cache.set(url.searchParams.toString(), { type: image.mime || "application/octet-stream", data: resizedImage });
   } else {
    requestEvent.respondWith(
     new Response(buffer, {
      headers: {
       "Content-Type": image.mime || "application/octet-stream",
       "Cache-Control": "public, max-age=31536000",
      },
     }),
    );
    cache.set(url.searchParams.toString(), { type: image.mime || "application/octet-stream", data: UArray });
   }
  } catch (_) {
   requestEvent.respondWith(new Response("Image not found on orgin server", { status: 400 }));
  }
 }
}
