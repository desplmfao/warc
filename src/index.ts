import { options, commoncrawl } from "./modules/commoncrawl";

let options: options = {
    index: 'CC-MAIN-2018-13-index',
    from: '2017',
    to: '2018',
    matchType: "prefix",
    limit: 100,
    page: 1,
    pageSize: 100,
    showNumPages: false,
    output: "json"
}

async function main() {
    try {
        await commoncrawl.searchURL('https://soundcloud.com/brahman_ncr', options);
    } catch (err) {
        throw new Error(err);
    }
}

main();