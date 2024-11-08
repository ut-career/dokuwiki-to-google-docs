export async function fetchDokuWikiPages(
	url: string,
	id: string,
	password: string,
): Promise<string[]> {
	try {
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

		const response = await fetch(
			`${url}/wiki/lib/plugins/jsonrpc/jsonrpc.php`,
			{
				method: "POST",
				headers: {
					Cookie: cookie,
				},
				body: JSON.stringify({
					method: { methodName: "wiki.getPage" },
					params: [{ string: "wiki:menu" }],
					id: "",
					jsonrpc: "2.0",
				}),
			},
		);

		const page = await response.json(); // Assuming the response data contains the pages in JSON format
		return [page.result];
	} catch (error) {
		console.error("Error fetching DokuWiki pages:", error);
		throw error;
	}
}
