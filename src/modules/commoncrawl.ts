import { IncomingMessage } from "node:http";
import https from "node:https";

type options = {
    index: string,
    url?: string,
    from: string | number,
    to: string | number,
    matchType: 'exact' | 'prefix' | 'host' | 'domain', // allowed values
    limit?: string | number,
    sort?: string | number,
    page?: string | number,
    pageSize?: number | number,
    showNumPages?: boolean,
    output?: string,
}

const agent = new https.Agent({
	rejectUnauthorized: false,
});

let commoncrawl = {
	getIndex() {
		return new Promise((resolve, reject) => {
			https
				.get(
					"https://index.commoncrawl.org/collinfo.json",
					{ agent: agent }, ( res: IncomingMessage ) => {
						let data = "";

						res.on("data", (chunk: String) => {
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
					},
				).on("error", (error) => {
					reject(error);
				});
		});
	},

	searchURL(
        url: string,
        options: options
	) {
		let indexid = options.index;

		let params = options;
		params.url = url;

		let query = Object.entries(params)
			.map(
				([key, value]) =>
					`${key}=${encodeURIComponent(value ? value : "")}`,
			)
			.join("&");

		let path = `/wayback/${indexid}?${query}`;

		console.log("2. after every 'let'");

		return new Promise((resolve, reject) => {
			console.log("3. in Promise");

			https
				.get(
					{
						hostname: "index.commoncrawl.org",
						agent: agent,
						path: path,
					},
					(res: IncomingMessage) => {
						let data = "";

						res.on("data", (chunk: String) => {
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
                                    if (!(e.indexOf("SyntaxError: Unexpected token '<', ") > -1)) {
                                        console.log(e)
                                    } else {
                                        return;
                                    }
								}
							});

							resolve(items);
						});
					},
				).on("error", (error) => {
					reject(error);
				});
		});
	},
};

export { options, commoncrawl }