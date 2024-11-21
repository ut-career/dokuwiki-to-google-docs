import { fetchPages, fetchPageByName } from "../infra/dokuwiki";
import { createFile } from "../infra/local";

type WikiToLocalParameters = {
	/** Dokukwikiの認証用cookie */
	cookie: string;
	/** DokukwikiのURL */
	dokuwikiUrl: string;
	/** ページを保存するディレクトリ名 */
	outputDirName: string;
};

/**
 * Dokuwikiからすべてのページを取得し、ローカルに保存します。
 *
 * output: outputDirName以下にページが保存されます。「:」は「_」に変換されます。
 */
export const wikiToLocal = async ({
	cookie,
	dokuwikiUrl,
	outputDirName,
}: WikiToLocalParameters) => {
	const pages = await fetchPages(dokuwikiUrl, cookie);
	console.info(`\t${pages.length} pages fetched`);
	for (const page of pages) {
		const content = await fetchPageByName(dokuwikiUrl, cookie, page.id);
		await createFile(`${outputDirName}/${page.id.replace(":", "_")}`, content);
	}
};
