chrome.runtime.sendMessage({
  scheme: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
});
