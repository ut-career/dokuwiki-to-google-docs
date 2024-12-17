import { stdout } from "node:process";
import readline from "node:readline";
import {
	replaceDevider,
	updateHeading,
	updateLink,
	updateOrderedListItem,
	updateUnorderListItem,
	writeDoc,
} from "../infra/googleDocs";
import { readFile } from "../infra/local";

const markdownLinkRegex = /[ ]?\[([^\]]*)\]\((http[^\)]*)\)/g;

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
	// for (const [dokuwikiPage, googleDocsId] of Object.entries(idMap)) {
	// 	const dokuwikiFilepath = `${dokuwikiPagesDirPath}/${dokuwikiPage}`;
	// 	await writeGoogleDocsBody(idMap, dokuwikiFilepath, googleDocsId);
	// }
	await writeGoogleDocsBody(
		idMap,
		`${dokuwikiPagesDirPath}/wiki_menu`,
		idMap.wiki_menu,
	);
	// await writeGoogleDocsBody(
	// 	idMap,
	// 	`${dokuwikiPagesDirPath}/wiki_remote-desktop`,
	// 	idMap["wiki_remote-desktop"],
	// );
};

const writeGoogleDocsBody = async (
	idMap: Record<string, string>,
	dokuwikiFilepath: string,
	googleDocsId: string,
) => {
	console.info(`\tWriting ${dokuwikiFilepath} to ${googleDocsId}`);
	const file = await readFile(dokuwikiFilepath);
	const googleDocsBody = file
		.replaceAll(
			/\[\[(\[\[)?([^\|\]]*)[\|]?([^\]]*)\]\](\\\\)?/g,
			(_, ...args) => {
				return dokuwikiLinkToMarkdownLink(args[1], args[2], idMap);
			},
		)
		.replaceAll("\n\n\n", "\n")
		.replaceAll("\\\\", "");

	await writeDoc(googleDocsId, googleDocsBody);
	const heading1UpdatedGoogleDocsBody = await updateHeadings(
		googleDocsId,
		googleDocsBody,
		/=======((?!=======)[^\n]*)=======/g,
		"HEADING_1",
	);
	const heading2UpdatedGoogleDocsBody = await updateHeadings(
		googleDocsId,
		heading1UpdatedGoogleDocsBody,
		/======((?!======)[^\n]*)======/g,
		"HEADING_2",
	);
	const heading3UpdatedGoogleDocsBody = await updateHeadings(
		googleDocsId,
		heading2UpdatedGoogleDocsBody,
		/=====((?!=====)[^\n]*)=====/g,
		"HEADING_3",
	);
	const heading4UpdatedGoogleDocsBody = await updateHeadings(
		googleDocsId,
		heading3UpdatedGoogleDocsBody,
		/====((?!====)[^\n]*)====/g,
		"HEADING_4",
	);
	const heading5UpdatedGoogleDocsBody = await updateHeadings(
		googleDocsId,
		heading4UpdatedGoogleDocsBody,
		/===((?!===)[^\n]*)===/g,
		"HEADING_5",
	);
	const heading6UpdatedGoogleDocsBody = await updateHeadings(
		googleDocsId,
		heading5UpdatedGoogleDocsBody,
		/==((?!==)[^\n]*)==/g,
		"HEADING_6",
	);
	const googleDocsBodyWithoutDividers = await updateDividers(
		googleDocsId,
		heading6UpdatedGoogleDocsBody,
	);
	const unorderListUpdated = await updateUnorderListItems(
		googleDocsId,
		googleDocsBodyWithoutDividers,
	);
	const orderListUpdated = await updateOrderListItems(
		googleDocsId,
		unorderListUpdated,
	);

	// 他の変換でリンクが失われないように、Linkのアップデートは最後に行う
	const r = await updateLinks(googleDocsId, orderListUpdated);
	console.info(r);
};

const updateLinks = async (
	googleDocsId: string,
	googleDocsBody: string,
): Promise<string> => {
	const rl = new readline.promises.Readline(stdout);
	const links = googleDocsBody.matchAll(markdownLinkRegex);
	console.info("\t\tUpdating links...");
	console.info("\t\tUpdated 0 links");
	let count = 0;
	let updatedResult = googleDocsBody;
	for (const [match, title, link] of links) {
		await updateLink(
			googleDocsId,
			match,
			link,
			// listの場合listの記号にも色がついてしまうので、前後にスペースを追加することでリンクのみに色がつくようにする
			` ${title || link} `,
			updatedResult.indexOf(match) + 1,
		);
		updatedResult = updatedResult.replace(match, ` ${title || link} `);
		count++;
		rl.moveCursor(0, -1);
		await rl.commit();
		console.info(`\t\tUpdated ${count} links`);
	}
	return updatedResult;
};

const updateHeadings = async (
	googleDocsId: string,
	googleDocsBody: string,
	regExp: RegExp,
	headingStyle: Parameters<typeof updateHeading>[2],
): Promise<string> => {
	const rl = new readline.promises.Readline(stdout);
	const headings = googleDocsBody.matchAll(regExp);
	console.info(`\t\tUpdating ${headingStyle}s...`);
	console.info(`\t\tUpdated 0 ${headingStyle}s`);
	let count = 0;
	let updatedResult = googleDocsBody;
	for (const [match, heading] of headings) {
		await updateHeading(
			googleDocsId,
			match,
			headingStyle,
			heading.trim(),
			updatedResult.indexOf(match) + 1,
			updatedResult.indexOf(match) + match.length + 2,
		);
		updatedResult = updatedResult.replace(match, heading.trim());
		count++;
		rl.moveCursor(0, -1);
		await rl.commit();
		console.info(`\t\tUpdated ${count} ${headingStyle}s`);
	}
	return updatedResult;
};

const updateDividers = async (
	googleDocsId: string,
	googleDocsBody: string,
): Promise<string> => {
	const rl = new readline.promises.Readline(stdout);
	const dividers = googleDocsBody.matchAll(/----\n/g);
	console.info("\t\tUpdating Dividers...");
	console.info("\t\tUpdated 0 Dividers");
	let count = 0;
	let updatedResult = googleDocsBody;
	for (const [match] of dividers) {
		const { raplacedObjectLength } = await replaceDevider(
			googleDocsId,
			match,
			updatedResult.indexOf(match),
		);
		updatedResult = updatedResult.replace(
			match,
			// - で置換すると↑のindexOfに引っかかるので、スペースで置換する
			" ".repeat(raplacedObjectLength),
		);
		count++;
		rl.moveCursor(0, -1);
		await rl.commit();
		console.info(`\t\tUpdated ${count} Dividers`);
	}
	return updatedResult;
};

const updateUnorderListItems = async (
	googleDocsId: string,
	googleDocsBody: string,
): Promise<string> => {
	const rl = new readline.promises.Readline(stdout);
	const bulletList = googleDocsBody.matchAll(/((?: {2})+)\*\s?([^\n]+)/g);
	console.info("\t\tUpdating unorder list items...");
	console.info("\t\tUpdated 0 unorder list items");
	let count = 0;
	let updatedResult = googleDocsBody;
	for (const [match, indent, text] of bulletList) {
		await updateUnorderListItem(
			googleDocsId,
			match,
			text,
			indent.replaceAll("  ", "*").length,
			updatedResult.indexOf(match) + 1,
			updatedResult.indexOf(match) + match.length + 2,
		);
		updatedResult = updatedResult.replace(match, text);
		count++;
		rl.moveCursor(0, -1);
		await rl.commit();
		console.info(`\t\tUpdated ${count} unorder list items`);
	}
	return updatedResult;
};

const updateOrderListItems = async (
	googleDocsId: string,
	googleDocsBody: string,
): Promise<string> => {
	const rl = new readline.promises.Readline(stdout);
	const bulletList = googleDocsBody.matchAll(/((?: {2})+)\-\s?([^\n]+)/g);
	console.info("\t\tUpdating order list items...");
	console.info("\t\tUpdated 0 order list items");
	let count = 0;
	let updatedResult = googleDocsBody;
	for (const [match, indent, text] of bulletList) {
		await updateOrderedListItem(
			googleDocsId,
			match,
			text,
			indent.replaceAll("  ", "-").length,
			updatedResult.indexOf(match) + 1,
			updatedResult.indexOf(match) + match.length + 2,
		);
		updatedResult = updatedResult.replace(match, text);
		count++;
		rl.moveCursor(0, -1);
		await rl.commit();
		console.info(`\t\tUpdated ${count} order list items`);
	}
	return updatedResult;
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
