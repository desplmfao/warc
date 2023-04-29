import http, { IncomingMessage } from "node:http";

type options = {
	index: string;
	url: string;
	from: string | number;
	to: string | number;
	matchType: "exact" | "prefix" | "host" | "domain";
	limit: string | number;
	sort?: string | number;
	page?: string | number;
	pageSize?: number | number;
	showNumPages?: boolean;
	output: string;
};

const agent = new http.Agent({
	//rejectUnauthorized: false,
	timeout: 60_000_000,
});

const RETRY_COUNT = Infinity;
const RETRY_DELAY_MS = 5000;

async function retryRequest(
	options: http.RequestOptions,
	retryCount = 0,
): Promise<IncomingMessage> {
	try {
		return await new Promise<IncomingMessage>((resolve, reject) => {
			http
				.get(options, resolve)
				.on("error", reject);
		});
	} catch (err) {
		if (retryCount < RETRY_COUNT) {
			return await new Promise((resolve) => setTimeout(async () => {
				console.log()

				retryRequest(options, retryCount + 1);

				return resolve;
			}, RETRY_DELAY_MS));
		} else {
			throw err;
		}
	}
};

let commoncrawl = {
	getIndex() {
		return new Promise(async (resolve, reject) => {
			await retryRequest(
				{
					hostname: "index.commoncrawl.org",
					path: "/collinfo.json",
					agent: agent,
				}
			)
				.then((res: IncomingMessage) => {
					let data = "";

					res.on("data", (chunk: string) => {
						data += chunk;
					});

					res.on("end", () => {
						try {
							let json = JSON.parse(data);
							resolve(json);
						} catch (error) {
							reject(error);
						}
					});
				})
				.catch((error) => {
					reject(error);
				});
		});
	},

	async searchURL(options: options) {
		let params = options;

		let query = Object.entries(params)
			.map(
				([key, value]) =>
					`${key}=${encodeURIComponent(value ? value : "")}`,
			)
			.join("&");

		let path = `/wayback/${options.index}?${query}`;

		console.log(path);

		return new Promise(async (resolve, reject) => {
			await retryRequest(
				{
					hostname: "index.commoncrawl.org",
					path: path,
					agent: agent,
				}
			)
				.then(async (res: IncomingMessage) => {
					if (
						res.statusCode &&
						res.statusCode >= 200 &&
						res.statusCode < 300
					) {
						let data = "";

						res.on("data", (chunk: string) => {
							data += chunk;
						});

						res.on("end", () => {
							if (options.showNumPages) {
								resolve(JSON.parse(data));
								return;
							}

							let items: string[] = [];
							let stringArray = data.split("\n");

							stringArray.map((item) => {
								try {
									console.log(item);

									let itemjson = JSON.parse(item);
									items.push(itemjson);
								} catch (e) {
									if (
										!(e.toString().startsWith("<") > -1)
									) {
										console.log(e);
									} else {
										//console.log("500s");
									}
								}
							});

							resolve(items);
						});
					} else {
						if (!(res.statusCode)) {
							console.log("request failed.");
						} else {
							console.log(res.statusCode);
						}
					}
				})
				.catch((error) => {
					//console.log(error)
					reject(error);
				});

		});
	}
};

export {
	options,
	commoncrawl
};
