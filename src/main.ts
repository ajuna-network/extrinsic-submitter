import { batchExtrinsics } from "./extrinsic";
import { createApi } from "./api";
import "log-timestamp";

const main = async () => {
  const wsAddr = "ws://127.0.0.1:9944"; // TODO: read url from env / cli arg
  const api = await createApi(wsAddr);

  await batchExtrinsics(api);
};

(async () => {
  await main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(`something went wrong: ${err}`);
      process.exit(1);
    });
})();
