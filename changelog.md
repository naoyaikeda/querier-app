# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2026-01-03

### Added
- Initial release of the application.
- Electron main process setup with `better-sqlite3` integration.
- Configuration loading from `picture-store-anime.env` in the user's home directory.
- Database schema initialization for `images`, `tags`, and `image_tags`.
- Custom `local-resource://` protocol for secure serving of Vault and Thumbnail images.
- Frontend UI with search input, tag dropdown, and responsive grid layout.
- Image preview modal for viewing full-size images from the Vault.
- IPC handlers for searching images and retrieving all tags.
