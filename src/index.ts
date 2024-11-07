import { fetchDokuWikiPages } from "./dokuwiki";
import { convertToGoogleDocs, uploadToGoogleDrive } from "./googleDocs";

const DOKUWIKI_URL = process.env.DOKUWIKI_URL || "";
const DOKUWIKI_ID = process.env.DOKUWIKI_ID || "";
const DOKUWIKI_PASSWORD = process.env.DOKUWIKI_PASSWORD || "";
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || "";

async function main() {
	try {
		const pages = await fetchDokuWikiPages(
			DOKUWIKI_URL,
			DOKUWIKI_ID,
			DOKUWIKI_PASSWORD,
		);
		for (const page of pages) {
			const googleDoc = await convertToGoogleDocs(page);
			await uploadToGoogleDrive(googleDoc, GOOGLE_DRIVE_FOLDER_ID);
		}
		console.log(
			"DokuWiki pages have been successfully converted and uploaded to Google Drive.",
		);
	} catch (error) {
		console.error("An error occurred:", error);
	}
}

main();
