import fs from "node:fs";

import { createDoc } from "../infra/googleDocs";
import { createFile } from "../infra/local";

type CreateDocsParameters = {
	/** Google DriveのフォルダID */
	googleDriveFolderId: string;
	/** Dokukwikiのファイルを保存したディレクトリpath */
	wikiFilesDirPath: string;
	/** ファイル名とIDのマップとなるJSONを保存するpath */
	outputJsonFilePath: string;
};

export const createDocs = async ({
	googleDriveFolderId,
	wikiFilesDirPath,
	outputJsonFilePath,
}: CreateDocsParameters) => {
	const filenameGoogleIdMap: Record<string, string> = {};
	const files = await fs.promises.readdir(wikiFilesDirPath);
	console.info(`\t${files.length} pages`);
	for (const file of files) {
		const id = await createDoc(googleDriveFolderId, file);
		if (!id) {
			throw new Error("Failed to create a Google Doc.");
		}
		filenameGoogleIdMap[file] = id;
	}
	await createFile(
		outputJsonFilePath,
		JSON.stringify(filenameGoogleIdMap, null, 2),
	);
};
