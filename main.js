const { app, BrowserWindow, ipcMain, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const dotenv = require('dotenv');
const Database = require('better-sqlite3');

let mainWindow;
let db;
let config = {};
let catalogs = {};
let currentCatalogName = '';

function loadConfig() {
  const envPath = path.join(os.homedir(), 'picture-store-anime.env');
  if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    config = { ...envConfig };
  } else {
    console.log('Config file not found at:', envPath);
  }

  // Load Catalogs JSON
  const catalogsPath = path.join(os.homedir(), 'picture-store-anime-catalogs.json');
  if (fs.existsSync(catalogsPath)) {
    try {
      catalogs = JSON.parse(fs.readFileSync(catalogsPath, 'utf8'));
      // Set default catalog if available
      const catalogNames = Object.keys(catalogs);
      if (catalogNames.length > 0) {
        currentCatalogName = catalogNames[0];
        // Override DB path if it's in the catalog
        if (catalogs[currentCatalogName].catalog_path) {
          config.PICTURE_STORE_ANIME_DB_PATH = catalogs[currentCatalogName].catalog_path;
        }
      }
    } catch (e) {
      console.error('Failed to parse catalogs JSON:', e);
    }
  }

  // Ensure we have the paths
  if (!config.PICTURE_STORE_ANIME_VAULT_PATH) {
    console.warn('PICTURE_STORE_ANIME_VAULT_PATH is not set.');
  }
  if (!config.PICTURE_STORE_ANIME_THUMBNAIL_PATH) {
    console.warn('PICTURE_STORE_ANIME_THUMBNAIL_PATH is not set.');
  }
  if (!config.PICTURE_STORE_ANIME_DB_PATH) {
    console.warn('PICTURE_STORE_ANIME_DB_PATH is not set.');
  }
}

function initDB() {
  if (!config.PICTURE_STORE_ANIME_DB_PATH) return;

  try {
    if (db) {
      db.close();
    }
    db = new Database(config.PICTURE_STORE_ANIME_DB_PATH, { verbose: console.log });

    // Create tables if they don't exist (Idempotent)
    db.exec(`
      CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT NOT NULL,
        file_name TEXT,
        vault_path TEXT,
        thumbnail_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tag TEXT UNIQUE
      );

      CREATE TABLE IF NOT EXISTS image_tags (
        image_id INTEGER,
        tag_id INTEGER,
        FOREIGN KEY(image_id) REFERENCES images(id),
        FOREIGN KEY(tag_id) REFERENCES tags(id),
        PRIMARY KEY(image_id, tag_id)
      );
    `);

    console.log('Database connected and initialized at:', config.PICTURE_STORE_ANIME_DB_PATH);
  } catch (err) {
    console.error('Failed to initialize database:', err);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // Needed to load local files from arbitrary paths easily in dev
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  loadConfig();
  initDB();

  // Protocol to serve files from Vault and Thumbnails
  protocol.handle('local-resource', async (request) => {
    const url = request.url.replace('local-resource://', '');
    // decode URI component to handle spaces/special chars
    const decodedUrl = decodeURIComponent(url);

    // Determine if it's a vault or thumbnail request
    // We can define a convention, e.g. local-resource://vault/filename
    // or local-resource://thumbnail/filename

    // Simple routing based on prefix
    try {
      let filePath;
      if (decodedUrl.startsWith('vault/')) {
        const relativePath = decodedUrl.replace('vault/', '');
        filePath = path.join(config.PICTURE_STORE_ANIME_VAULT_PATH, relativePath);
      } else if (decodedUrl.startsWith('thumbnail/')) {
        const relativePath = decodedUrl.replace('thumbnail/', '');
        filePath = path.join(config.PICTURE_STORE_ANIME_THUMBNAIL_PATH, relativePath);
      }

      if (filePath) {
        return await net.fetch('file://' + filePath); // net is needed, import it
      }
    } catch (e) {
      console.error(e);
    }

    return new Response('Not Found', { status: 404 });
  });

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers
ipcMain.handle('search-images', (event, { tag }) => {
  if (!db) return { error: 'Database not initialized' };

  try {
    let sql = `
      SELECT i.*, GROUP_CONCAT(t.tag) as tags
      FROM images i
      LEFT JOIN image_tags it ON i.id = it.image_id
      LEFT JOIN tags t ON it.tag_id = t.id
    `;

    const params = [];
    const conditions = [];

    if (tag) {
      // Filter by tag
      // Use subquery to find image_ids that have the tag
      conditions.push(`i.id IN (
        SELECT it2.image_id
        FROM image_tags it2
        JOIN tags t2 ON it2.tag_id = t2.id
        WHERE t2.tag LIKE ?
      )`);
      params.push(`%${tag}%`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' GROUP BY i.id ORDER BY i.created_at DESC LIMIT 100';

    const stmt = db.prepare(sql);
    const rows = stmt.all(...params);
    return rows;
  } catch (err) {
    console.error('Search error:', err);
    return { error: err.message };
  }
});

ipcMain.handle('get-all-tags', () => {
  if (!db) return [];
  try {
    return db.prepare('SELECT * FROM tags ORDER BY tag').all();
  } catch (err) {
    return [];
  }
});

ipcMain.handle('get-catalogs', () => {
  return {
    catalogs: Object.keys(catalogs),
    current: currentCatalogName
  };
});

ipcMain.handle('switch-catalog', (event, name) => {
  if (catalogs[name]) {
    currentCatalogName = name;
    if (catalogs[name].catalog_path) {
      config.PICTURE_STORE_ANIME_DB_PATH = catalogs[name].catalog_path;
    }
    // Optional: handle vault/thumbnail path overrides if present in JSON
    if (catalogs[name].vault_path) {
      config.PICTURE_STORE_ANIME_VAULT_PATH = catalogs[name].vault_path;
    }
    if (catalogs[name].thumbnail_path) {
      config.PICTURE_STORE_ANIME_THUMBNAIL_PATH = catalogs[name].thumbnail_path;
    }

    initDB();
    return { success: true, current: currentCatalogName };
  }
  return { success: false, error: 'Catalog not found' };
});


