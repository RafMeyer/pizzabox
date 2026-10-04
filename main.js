const { app, BrowserWindow, WebContentsView, ipcMain } = require("electron");
const path = require("path");

app.setName("PizzaBox");
const HOME = "https://www.google.com/";
const TOOLBAR_HEIGHT = 106;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "PizzaBox/0.1";

let win;
let tabs = [];
let activeId = null;
let nextId = 1;

function normalizeAddress(value) {
  value = String(value || "").trim();
  if (!value) return HOME;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(value)) return value;
  if (value.startsWith("localhost") || value.includes(".") || value.includes(":")) return "https://" + value;
  return "https://www.google.com/search?q=" + encodeURIComponent(value);
}

function activeTab() { return tabs.find(tab => tab.id === activeId); }
function browserBounds() {
  const [width, height] = win.getContentSize();
  return { x: 0, y: TOOLBAR_HEIGHT, width: Math.max(1, width), height: Math.max(1, height - TOOLBAR_HEIGHT) };
}
function layout() {
  const active = activeTab();
  for (const tab of tabs) tab.view.setVisible(tab.id === activeId);
  if (active) active.view.setBounds(browserBounds());
}
function sendState() {
  if (!win || win.isDestroyed()) return;
  const tab = activeTab();
  win.webContents.send("browser-state", {
    activeId,
    url: tab?.url || "",
    canGoBack: !!tab && tab.view.webContents.navigationHistory.canGoBack(),
    canGoForward: !!tab && tab.view.webContents.navigationHistory.canGoForward(),
    tabs: tabs.map(t => ({ id: t.id, title: t.title || "New Tab" }))
  });
}
function attachTabEvents(tab) {
  const wc = tab.view.webContents;
  wc.setUserAgent(USER_AGENT);
  wc.on("page-title-updated", (_event, title) => { tab.title = title || "New Tab"; sendState(); });
  wc.on("did-navigate", (_event, url) => { tab.url = url; sendState(); });
  wc.on("did-navigate-in-page", (_event, url) => { tab.url = url; sendState(); });
  wc.on("did-start-loading", sendState);
  wc.on("did-stop-loading", sendState);
  wc.setWindowOpenHandler(({ url }) => { createTab(url, true); return { action: "deny" }; });
  wc.on("before-input-event", (_event, input) => handleShortcut(input));
}
function createTab(url = HOME, makeActive = true) {
  const id = nextId++;
  const view = new WebContentsView({
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true, javascript: true }
  });
  view.setBackgroundColor("#ffffff");
  const tab = { id, view, title: "New Tab", url };
  tabs.push(tab);
  win.contentView.addChildView(view);
  attachTabEvents(tab);
  if (makeActive) activeId = id;
  view.webContents.loadURL(normalizeAddress(url)).catch(console.error);
  layout(); sendState();
  return tab;
}
function selectTab(id) {
  const tab = tabs.find(t => t.id === id);
  if (!tab) return;
  activeId = id; layout(); sendState(); tab.view.webContents.focus();
}
function closeTab(id) {
  const index = tabs.findIndex(t => t.id === id);
  if (index === -1) return;
  const tab = tabs[index];
  win.contentView.removeChildView(tab.view);
  if (!tab.view.webContents.isDestroyed()) tab.view.webContents.close({ waitForBeforeUnload: false });
  tabs.splice(index, 1);
  if (tabs.length === 0) return void createTab(HOME, true);
  if (activeId === id) activeId = tabs[Math.min(index, tabs.length - 1)].id;
  layout(); sendState();
}
function navigate(value) {
  const tab = activeTab(); if (!tab) return;
  tab.view.webContents.loadURL(normalizeAddress(value)).catch(console.error);
}
function handleShortcut(input) {
  if (input.type !== "keyDown") return;
  const command = process.platform === "darwin" ? input.meta : input.control;
  if (!command) return;
  const key = input.key.toLowerCase();
  if (key === "l") { win.webContents.focus(); win.webContents.send("focus-address"); }
  else if (key === "t") createTab(HOME, true);
  else if (key === "w") closeTab(activeId);
  else if (key === "r") activeTab()?.view.webContents.reload();
}
function createWindow() {
  win = new BrowserWindow({
    width: 1280, height: 820, minWidth: 720, minHeight: 500,
    title: "PizzaBox", titleBarStyle: "hiddenInset", backgroundColor: "#ffffff",
    webPreferences: { preload: path.join(__dirname, "preload.js"), nodeIntegration: false, contextIsolation: true, sandbox: true }
  });
  win.loadFile("ui.html");
  win.on("resize", layout);
  win.webContents.on("before-input-event", (_event, input) => handleShortcut(input));
  win.webContents.once("did-finish-load", () => createTab(HOME, true));
}

ipcMain.on("tab-new", () => createTab(HOME, true));
ipcMain.on("tab-close", (_event, id) => closeTab(id));
ipcMain.on("tab-select", (_event, id) => selectTab(id));
ipcMain.on("navigate", (_event, value) => navigate(value));
ipcMain.on("back", () => { const wc = activeTab()?.view.webContents; if (wc?.navigationHistory.canGoBack()) wc.navigationHistory.goBack(); });
ipcMain.on("forward", () => { const wc = activeTab()?.view.webContents; if (wc?.navigationHistory.canGoForward()) wc.navigationHistory.goForward(); });
ipcMain.on("reload", () => activeTab()?.view.webContents.reload());
ipcMain.on("home", () => navigate(HOME));

app.whenReady().then(createWindow);
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
