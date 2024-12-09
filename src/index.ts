import { login } from "./infra/dokuwiki";
import { wikiToLocal } from "./service/wiki-to-local";
import { createDocs } from "./service/create-docs";
import { uploadMedia } from "./service/upload-media";
import { writeDocs } from "./service/write-docs";

const DOKUWIKI_URL = process.env.DOKUWIKI_URL || "";
const DOKUWIKI_ID = process.env.DOKUWIKI_ID || "";
const DOKUWIKI_PASSWORD = process.env.DOKUWIKI_PASSWORD || "";
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || "";

const OUTPUT_DIR_NAME = "out";
const OUTPUT_DOKUWIKI_DIR = `./${OUTPUT_DIR_NAME}/dokuwiki`;
const OUTPUT_DOC_ID_MAP_JSON = `./${OUTPUT_DIR_NAME}/idMap.json`;
const OUTPUT_MEDIA_ID_MAP_JSON = `./${OUTPUT_DIR_NAME}/mediaIdMap.json`;

/**
 * DokuWikiのページをGoogle Driveにアップロードします。
 *
 * デバッグを容易にするため、および途中からでも実行できるように一時ファイルに保存を行います。
 *
 * GoogleDriveAPIにはRateLimitがあるが、1ファイルずつ操作しているため制限にはかからない。
 */
const main = async () => {
	console.info("Logging in to DokuWiki...");
	const { cookie } = await login(DOKUWIKI_URL, DOKUWIKI_ID, DOKUWIKI_PASSWORD);

	console.info("Fetching DokuWiki pages...");
	await wikiToLocal({
		cookie,
		dokuwikiUrl: DOKUWIKI_URL,
		outputDirName: OUTPUT_DOKUWIKI_DIR,
	});

	console.info("Uploading DokuWiki pages to Google Drive...");
	await createDocs({
		googleDriveFolderId: GOOGLE_DRIVE_FOLDER_ID,
		wikiFilesDirPath: OUTPUT_DOKUWIKI_DIR,
		outputJsonFilePath: OUTPUT_DOC_ID_MAP_JSON,
	});

	console.info("Uploading Dokuwiki static files to Google Drive...");
	await uploadMedia({
		cookie,
		dokuwikiUrl: DOKUWIKI_URL,
		googleDriveFolderId: GOOGLE_DRIVE_FOLDER_ID,
		outputJsonFilePath: OUTPUT_MEDIA_ID_MAP_JSON,
	});

	console.info("Writing DokuWiki pages to Google Docs...");
	await writeDocs({
		docIdMapJsonPath: OUTPUT_DOC_ID_MAP_JSON,
		dokuwikiPagesDirPath: OUTPUT_DOKUWIKI_DIR,
	});
};

main()
	.then(() =>
		console.log(
			"DokuWiki pages have been successfully converted and uploaded to Google Drive.",
		),
	)
	.catch((error) => console.error("An error occurred:", error));
