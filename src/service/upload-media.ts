import { stdout } from "node:process";
import readline from "node:readline";
import { fetchMediaIdList, fetchMediaStream } from "../infra/dokuwiki";
import { uploadFile } from "../infra/googleDocs";
import { createFile } from "../infra/local";

type UploadMediaParameters = {
	/** Dokukwikiの認証用cookie */
	cookie: string;
	/** DokukwikiのURL */
	dokuwikiUrl: string;
	googleDriveFolderId: string;
	/** ファイル名とIDのマップとなるJSONを保存するpath */
	outputJsonFilePath: string;
};

export const uploadMedia = async ({
	cookie,
	dokuwikiUrl,
	googleDriveFolderId,
	outputJsonFilePath,
}: UploadMediaParameters) => {
	const rl = new readline.promises.Readline(stdout);
	const filenameGoogleIdMap: Record<string, string> = {};
	const files = await fetchMediaIdList(dokuwikiUrl, cookie);
	console.info(`\t${files.length} files`);
	console.info("\t0 files uploaded");
	for (const [idx, file] of files.entries()) {
		const mimeType = mimeTypeFromFileName(file.id);
		const s = await fetchMediaStream(dokuwikiUrl, cookie, file.id);
		const id = await uploadFile({
			name: file.id.replace(":", "_"),
			parent: googleDriveFolderId,
			mimeType,
			body: s,
		});
		if (!id) {
			throw new Error("Failed to upload a file.");
		}
		filenameGoogleIdMap[file.id] = id;
		rl.moveCursor(0, -1);
		rl.commit();
		console.info(`\t${idx + 1} files uploaded`);
	}
	await createFile(
		outputJsonFilePath,
		JSON.stringify(filenameGoogleIdMap, null, 2),
	);
};

/**
 * 自社にあるもののみ
 *
 * @see https://developer.mozilla.org/ja/docs/Web/HTTP/MIME_types/Common_types
 */
const mimeTypeFromFileName = (fileName: string) => {
	const ext = fileName.split(".").pop();
	switch (ext) {
		case "doc":
			return "application/msword";
		case "docx":
			return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
		case "xls":
			return "application/vnd.ms-excel";
		case "xlsx":
			return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
		case "ppt":
			return "application/vnd.ms-powerpoint";
		case "pptx":
			return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
		case "png":
			return "image/png";
		case "jpg":
			return "image/jpeg";
		case "jpeg":
			return "image/jpeg";
		case "svg":
			return "image/svg+xml";
		case "mp4":
			return "video/mp4";
		case "pdf":
			return "application/pdf";
		case "zip":
			return "application/zip";
		default:
			throw new Error(`Unknown file extension: ${ext}`);
	}
};
