import fs from "node:fs";
import path from "node:path";

export const createFile = async (filePath: string, content: string) => {
	if (filePath.includes(":")) {
		throw new Error(`filePath should not include ':'. filePath: ${filePath}`);
	}
	const dir = path.dirname(filePath);
	await fs.promises.mkdir(dir, { recursive: true });
	await fs.promises.writeFile(filePath, content);
};

export const readFile = async (filePath: string) => {
	return fs.promises.readFile(filePath, { encoding: "utf-8" });
};
