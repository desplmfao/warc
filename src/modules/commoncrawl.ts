import { IncomingMessage } from "node:http";
import https from "node:https";

type options = {
	index: string;
	url?: string;
	from: string | number;
	to: string | number;
	matchType: "exact" | "prefix" | "host" | "domain";
	limit?: string | number;
	sort?: string | number;
	page?: string | number;
	pageSize?: number | number;
	showNumPages?: boolean;
	output?: string;
};

const agent = new https.Agent({
	rejectUnauthorized: false,
	timeout: 60_000_000,
});

const RETRY_COUNT = Infinity;
const RETRY_DELAY_MS = 5000;

async function retryRequest(
	options: https.RequestOptions,
	retryCount = 0,
): Promise<IncomingMessage> {
    console.log("trying")

	try {
		return await new Promise<IncomingMessage>((resolve, reject) => {
			https.get(options, resolve).on("error", reject);
		});
	} catch (err) {
		if (retryCount < RETRY_COUNT) {
			await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
			return retryRequest(options, retryCount + 1);
		} else {
			throw err;
		}
	}
}

let commoncrawl = {
	getIndex() {
		return new Promise((resolve, reject) => {
			retryRequest(
				{
					hostname: "index.commoncrawl.org",
					path: "/collinfo.json",
					agent: agent,
				},
				0,
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
		let indexid = options.index;

		let params = options;

		let query = Object.entries(params)
			.map(
				([key, value]) =>
					`${key}=${encodeURIComponent(value ? value : "")}`,
			)
			.join("&");

		let path = `/wayback/${indexid}?${query}`;

        console.log(path)

        async function _try() {
            return new Promise((resolve, reject) => {
                retryRequest(
                    {
                        hostname: "index.commoncrawl.org",
                        path: path,
                        agent: agent,
                    },
                    0,
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
                                        if (!(e.toString().startsWith("<") > -1)) {
                                            console.log(e);
                                        } else {
                                            //console.log("500s");
                                        }
                                    }
                                });
    
                                resolve(items);
                            });
                        } else {
                            console.log(`HTTP status ${res.statusCode}`);
                            await _try();
                        }
                    }).catch((error) => {
                        //console.log(error)
                        reject(error);
                    });
            })
        }

        for (let i = 0; i < RETRY_COUNT; i++) {
            await _try();
        }
	},
};

export { options, commoncrawl };
