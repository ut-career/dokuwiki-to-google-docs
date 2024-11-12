// @see https://www.dokuwiki.org/plugin:jsonrpc

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
	try {
		const response = await fetch(
			`${url}/wiki/lib/plugins/jsonrpc/jsonrpc.php`,
			{
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
			},
		);

		const page = await response.json(); // Assuming the response data contains the pages in JSON format
		return page.result;
	} catch (error) {
		console.error("Error fetching DokuWiki pages:", error);
		throw error;
	}
};
