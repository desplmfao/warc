import { options, commoncrawl } from "./modules/commoncrawl";

let url = "https://soundcloud.com/brahman_ncr";

let options: options = {
	url: url,
	index: "CC-MAIN-2018-17-index",
	from: "2017",
	to: "2018",
	matchType: "prefix",
	limit: 100,
	page: 1,
	pageSize: 100,
	showNumPages: false,
	output: "json",
};

async function main() {
	try {
		//console.log(await commoncrawl.getIndex());
		await commoncrawl.searchURL(options);
	} catch (err) {
		throw new Error(err);
	}
}

main();
