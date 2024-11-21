import { login, fetchPages } from "./infra/dokuwiki";
import { createDoc } from "./infra/googleDocs";

const DOKUWIKI_URL = process.env.DOKUWIKI_URL || "";
const DOKUWIKI_ID = process.env.DOKUWIKI_ID || "";
const DOKUWIKI_PASSWORD = process.env.DOKUWIKI_PASSWORD || "";
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || "";

async function main() {
	try {
		const { cookie } = await login(
			DOKUWIKI_URL,
			DOKUWIKI_ID,
			DOKUWIKI_PASSWORD,
		);
		const pages = await fetchPages(DOKUWIKI_URL, cookie);
		for (const page of pages.filter((p) => p.id.startsWith("wiki:menu"))) {
			await createDoc(GOOGLE_DRIVE_FOLDER_ID, page.id);
		}
		console.log(
			"DokuWiki pages have been successfully converted and uploaded to Google Drive.",
		);
	} catch (error) {
		console.error("An error occurred:", error);
	}
}

main();
