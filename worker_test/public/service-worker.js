self.addEventListener("install", (event) => {
  event.waitUntil(console.log("Service worker installing"));
});
self.addEventListener("activate", (event) => {
  event.waitUntil("Service Worker activating.");
});

self.addEventListener("backgroundfetchsuccess", (event) => {
  event.waitUntil(
    (async function () {
      const bgFetch = event.registration;
      const records = await bgFetch.matchAll();
      console.log("Fetched records:", records);

      const cache = await caches.open("my-cache");
      let successful = true;

      for (const record of records) {
        try {
          console.log("Record", record);
          const response = await record.responseReady;
          console.log("Response", response);
          const method = record.request.method;
          console.log("method type", method);
          if (method === "PUT") {
            console.log("Processing upload...");
            // Handle upload-specific logic
          } else if (method === "GET") {
            console.log("Processing download...");
            if (response.ok) {
              await cache.put(record.request.url, response.clone());
            } else {
              successful = false;
            }
          }
        } catch (error) {
          console.error("Error processing record:", error);
          successful = false;
        }
      }

      if (successful) {
        console.log("Background Fetch succeeded");
      } else {
        console.log("Background Fetch failed");
      }

      const clients = await self.clients.matchAll();
      clients.forEach((client) => {
        client.postMessage({ message: "Background fetch succeeded" });
      });
    })()
  );
});

self.addEventListener("backgroundfetchfail", (event) => {
  console.log("Background Fetch failed:", event);
  console.log("Background Fetch failed:", event.registration);
});

self.addEventListener("backgroundfetchabort", (event) => {
  console.log("Background Fetch aborted:", event.registration);
});

self.addEventListener("backgroundfetchclick", (event) => {
  clients.openWindow("/");
});
