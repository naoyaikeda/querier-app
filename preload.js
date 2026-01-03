const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  searchImages: (params) => ipcRenderer.invoke('search-images', params),
  getAllTags: () => ipcRenderer.invoke('get-all-tags'),
  getCatalogs: () => ipcRenderer.invoke('get-catalogs'),
  switchCatalog: (name) => ipcRenderer.invoke('switch-catalog', name)
});
