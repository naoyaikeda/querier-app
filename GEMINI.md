# Querier

## 技術スタック

Electron

## 要件

設定情報は、ファイルとして展開する。ユーザによるメインテナンシビリティ配慮。構成としては、カタログ、Thumbnails、Vaultの3つからなる。大まかな設定情報はホームディレクトリ直下のpicture-store-anime.envに格納。ここには、dotenvの形式でPICTURE_STORE_ANIME_VAULT_PATH、PICTURE_STORE_ANIME_THUMBNAIL_PATH、PICTURE_STORE_ANIME_DB_PATHが置かれている。PICTURE_STORE_ANIME_VAULT_PATH、PICTURE_STORE_ANIME_THUMBNAIL_PATHはそれぞれ、VaultとThumbnailsのパスである。PICTURE_STORE_ANIME_DB_PATHはカタログDB(SQLite)のパスである。
VaultとThumbnailsは双方ともフラットなフォルダである。
Vault内部にはUUIDに拡張子をつけて画像本体が、Thumbnails内部にはUUISに_thumbをつけて、拡張子が付けられて、サムネイルが置かれる。Thumbnailsの形式は画像本体の形式と同じである。カタログはSQLiteのデータベースであり、

imagesテーブルがカタログの本体である。imagesテーブルにはid、uuid、file_name、vault_path、thumbnail_path、created_atがある。idは画像のidであり整数である。file_nameは元々の画像のファイル名が格納される。vault_pathはvaultに置かれた本体のファイル名である。thumbnail_pathはサムネイルのファイル名である。crated_atに投入時の日時が置かれる。

tagsテーブルはタグ情報であり、id列とtag列をもつ。idがタグのidであり、tagはタグの文字列である。

image_tagsテーブルにはタグと画像を紐づける情報が置かれる。image_idが画像のidである。tag_idがタグのIDである。結果画像とタグはN対Nの関係になる。

## カタログ切り替え機能

複数のカタログを切り替えて利用することができる。ホームディレクトリ直下に `picture-store-anime-catalogs.json` というJSON形式の設定ファイルを配置する。
このファイルには、カタログ名をキー、設定内容を値とする辞書形式で定義する。

例:
```json
{
    "pixiv": {
        "catalog_path": "path/to/pixiv.db"
    },
    "other": {
        "catalog_path": "path/to/other.db"
    }
}
```

アプリ起動時には、このJSONファイルが存在する場合、最初のカタログがデフォルトとしてロードされる。JSON内の `catalog_path` は `.env` の `PICTURE_STORE_ANIME_DB_PATH` を上書きする。画面上部のセレクターからカタログを動的に切り替えることが可能である。

