// @see https://www.dokuwiki.org/plugin:jsonrpc
import { Readable } from "node:stream";
import type * as streamWeb from "node:stream/web";

/**
 * login はDokuWikiにログインし、Cookieを返します。
 */
export const login = async (url: string, id: string, password: string) => {
	const loginResponse = await fetch(
		`${url}/wiki/lib/plugins/jsonrpc/jsonrpc.php`,
		{
			method: "POST",
			body: JSON.stringify({
				method: { methodName: "dokuwiki.login" },
				params: [{ string: id }, { string: password }],
				id: "",
				jsonrpc: "2.0",
			}),
		},
	);

	if (!loginResponse.ok) {
		throw new Error("Failed to fetch dokuwiki.login");
	}

	const loginResult = await loginResponse.json();
	if (!loginResult.result) {
		throw new Error("Failed to login to DokuWiki");
	}

	const cookies = loginResponse.headers.getSetCookie();
	// `DWd6fcb57a725757b22fe830cccebe05e6=deleted` みたいなcookieは除外する。
	const cookie = cookies
		.map((x) => x.split(";")[0])
		.filter((x) => !x.includes("=deleted"))
		.join("; ");

	return { cookie };
};

export const fetchPages = async (
	url: string,
	cookie: string,
): Promise<
	Array<{
		id: string;
		perms: number;
		size: number;
		lastModified: unknown;
	}>
> => {
	const response = await fetch(`${url}/wiki/lib/plugins/jsonrpc/jsonrpc.php`, {
		method: "POST",
		headers: {
			Cookie: cookie,
		},
		body: JSON.stringify({
			method: { methodName: "wiki.getAllPages" },
			params: [],
			id: "",
			jsonrpc: "2.0",
		}),
	});

	if (!response.ok) {
		throw new Error("Failed to fetch wiki.getAllPages");
	}

	const result = await response.json();
	return result.result;
};

export const fetchPageByName = async (
	url: string,
	cookie: string,
	pageName: string,
): Promise<string> => {
	const response = await fetch(`${url}/wiki/lib/plugins/jsonrpc/jsonrpc.php`, {
		method: "POST",
		headers: {
			Cookie: cookie,
		},
		body: JSON.stringify({
			method: { methodName: "wiki.getPage" },
			params: [{ string: pageName }],
			id: "",
			jsonrpc: "2.0",
		}),
	});

	const page = await response.json();
	return page.result;
};

export const fetchMediaIdList = async (
	url: string,
	cookie: string,
): Promise<Array<{ id: string }>> => {
	const response = await fetch(`${url}/wiki/lib/plugins/jsonrpc/jsonrpc.php`, {
		method: "POST",
		headers: {
			Cookie: cookie,
		},
		body: JSON.stringify({
			method: { methodName: "wiki.getAttachments" },
			params: [{ string: "" }],
			id: "",
			jsonrpc: "2.0",
		}),
	});

	const page = await response.json();
	return page.result;
};

export const fetchMediaStream = async (
	url: string,
	cookie: string,
	mediaId: string,
): Promise<NodeJS.ReadableStream> => {
	const response = await fetch(
		`${url}/wiki/lib/exe/fetch.php?media=${mediaId}`,
		{
			headers: {
				Cookie: cookie,
			},
		},
	);
	if (response.body === null) {
		throw new Error(`Failed to fetch ${mediaId}`);
	}
	return Readable.fromWeb(response.body as streamWeb.ReadableStream);
};
