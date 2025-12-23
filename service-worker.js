self.addEventListener("install", () => {
  console.log("Service Worker installed");
});

self.addEventListener("fetch", () => {
  // MVP-ben nem cache-elünk még
});
