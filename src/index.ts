import { options, commoncrawl } from "./modules/commoncrawl";

let options: options = {
    index: 'CC-MAIN-2019-30-index',
    from: '2018',
    to: '2019',
    matchType: "domain",
    limit: 100,
    page: 1,
    pageSize: 100,
    showNumPages: false,
    output: "json"
}

async function main() {
    try {
        await commoncrawl.searchURL('example.com', options);
    } catch (err) {
        throw new Error(err);
    }
}

main();