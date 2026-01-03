# Picture Store Anime Querier

Electron-based local image search application.
Designed to browse and search images stored in a specific vault structure with separate thumbnails and a SQLite catalog.

## Features

- **Local Image Search**: Search images by filename.
- **Tag Filtering**: Filter images by associated tags.
- **Fast Viewing**: Grid view with thumbnails and full-size preview modal.
- **Secure File Access**: Uses custom `local-resource://` protocol to safely serve local files.

## Prerequisites

- Node.js (v14 or higher recommended)
- npm

## Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Rebuild native modules (required for `better-sqlite3`):
   ```bash
   npx @electron/rebuild
   ```

## Configuration

This application requires a configuration file located in your user home directory.

1. Create a file named `picture-store-anime.env` in your home directory (e.g., `C:\Users\YourName\` on Windows).
2. Add the following environment variables to define the paths:

   ```env
   # Path to the directory containing original images
   PICTURE_STORE_ANIME_VAULT_PATH=C:\Path\To\Your\Vault

   # Path to the directory containing thumbnail images
   PICTURE_STORE_ANIME_THUMBNAIL_PATH=C:\Path\To\Your\Thumbnails

   # (Optional) Path to the SQLite catalog database
   # If not set, defaults to ~/picture-store-anime-catalog.db
   PICTURE_STORE_ANIME_CATALOG_PATH=C:\Path\To\Your\database.db
   ```

### Database Schema

The application expects a SQLite database with the following schema (tables are created automatically if they don't exist, but data must be populated externally):

- **images**: Stores image metadata (`id`, `uuid`, `file_name`, `vault_path`, `thumbnail_path`, `created_at`).
- **tags**: Stores tag definitions (`id`, `tag`).
- **image_tags**: Links images to tags (`image_id`, `tag_id`).

## Usage

Start the application:

```bash
npm start
```

## Technical Stack

- **Framework**: Electron
- **Database**: SQLite (via `better-sqlite3`)
- **Configuration**: dotenv
