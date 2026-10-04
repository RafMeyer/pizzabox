const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("pizzaBox", {
  newTab: () => ipcRenderer.send("tab-new"),
  closeTab: id => ipcRenderer.send("tab-close", id),
  selectTab: id => ipcRenderer.send("tab-select", id),
  navigate: url => ipcRenderer.send("navigate", url),
  back: () => ipcRenderer.send("back"),
  forward: () => ipcRenderer.send("forward"),
  reload: () => ipcRenderer.send("reload"),
  home: () => ipcRenderer.send("home"),
  onState: callback => ipcRenderer.on("browser-state", (_event, state) => callback(state)),
  onFocusAddress: callback => ipcRenderer.on("focus-address", callback)
});
