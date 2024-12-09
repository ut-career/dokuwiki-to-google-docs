import { stdout } from "node:process";
import readline from "node:readline";
import { updateLink, writeDoc } from "../infra/googleDocs";
import { readFile } from "../infra/local";

const markdownLinkRegex = /\[([^\]]*)\]\((http[^\)]*)\)/g;

export const writeDocs = async ({
	docIdMapJsonPath,
	dokuwikiPagesDirPath,
}: {
	docIdMapJsonPath: string;
	dokuwikiPagesDirPath: string;
}) => {
	const idMap = JSON.parse(await readFile(docIdMapJsonPath)) as Record<
		string,
		string
	>;
	const file = await readFile(`${dokuwikiPagesDirPath}/wiki_menu`);
	const result = file.replaceAll(
		/\[\[(\[\[)?([^\|\]]*)[\|]?([^\]]*)\]\](\\\\)?/g,
		(_, ...args) => {
			return dokuwikiLinkToMarkdownLink(args[1], args[2], idMap);
		},
	);
	console.log("+++++++++++++++++++++++++++");
	console.log(result);

	const menuId = idMap.wiki_menu;
	await writeDoc(menuId, result);

	const rl = new readline.promises.Readline(stdout);
	// resultの中のリンクを取得
	// そのリンクをGoogle Driveのリンクに変換
	const links = result.matchAll(markdownLinkRegex);
	console.info("Updating links...");
	console.info("\tUpdated 0 links");
	let count = 0;
	let updatedResult = result;
	for (const [match, title, link] of links) {
		await updateLink(
			menuId,
			match,
			link,
			title || link,
			updatedResult.indexOf(match) + 1,
			updatedResult.indexOf(match) + match.length + 2,
		);
		updatedResult = updatedResult.replace(match, title || link);
		count++;
		rl.moveCursor(0, -1);
		rl.commit();
		console.info(`\tUpdated ${count} links`);
	}
};

/**
 * DokuwikiのリンクをMarkdownのリンクに変換。
 */
const dokuwikiLinkToMarkdownLink = (
	dokuwikiLinkTarget: string,
	dokuwikiLinkTitle: string,
	idMap: Record<string, string>,
) => {
	if (dokuwikiLinkTarget.startsWith("http")) {
		return markdownLink(dokuwikiLinkTitle, dokuwikiLinkTarget);
	}

	const id = idMap[dokuwikiLinkTargetToDokuwikiId(dokuwikiLinkTarget)];
	return markdownLink(
		dokuwikiLinkTitle || dokuwikiLinkTargetToTitle(dokuwikiLinkTarget),
		`https://docs.google.com/document/d/${id}`,
	);
};

/**
 * dokuwikiのリンクターゲットをdokuwikiのページタイトルに変換
 */
const dokuwikiLinkTargetToTitle = (target: string) => {
	const names = target.split(":");
	return names[names.length - 1];
};

/**
 * dokuwikiのリンクターゲットをdokuwikiのページIDに変換
 */
const dokuwikiLinkTargetToDokuwikiId = (title: string) => {
	return title
		.replace(":", () => (title.startsWith(":") ? "" : "_"))
		.replace("･", "_")
		.replace("(", "_")
		.replace(")", "")
		.replace(" ", "_")
		.toLowerCase();
};

const markdownLink = (title: string, link: string) => {
	// titleは空文字の場合があるので、その場合はlinkをtitleとして返す
	return `[${title || link}](${link})`;
};
