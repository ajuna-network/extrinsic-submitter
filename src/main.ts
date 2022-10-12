import { ApiPromise, WsProvider, Keyring } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/types";
import "log-timestamp";

import { setup, mint } from "./setup";

const main = async () => {
  const provider = new WsProvider("ws://127.0.0.1:9944");
  const api = await ApiPromise.create({ provider });

  const keyring = new Keyring({ type: "sr25519" });
  const sudoPair = keyring.addFromUri("//Alice");
  const organizerPair = keyring.addFromUri("//Alice");
  const playerPair = keyring.addFromUri("//Alice");

  await setup(
    api,
    sudoPair,
    organizerPair,
    organizerPair.address,
    playerPair.address
  );
  await mint(api, playerPair, 1000, 10);

  // let nonce = Number(await api.rpc.system.accountNextIndex(playerPair.address));
  const leaderId = (
    (await api.query.awesomeAvatars
      .owners(playerPair.address)
      .then((avatarIds) => avatarIds.toJSON())) as Array<String>
  )[0];
  console.log("starting forge");

  const initialDna = await getDna(api, leaderId);
  let currentDna = initialDna;

  let sacrificed = 0;
  console.log(`initial DNA: ${initialDna}`);

  while (true) {
    const avatarIds = (await api.query.awesomeAvatars
      .owners(playerPair.address)
      .then((x) => x.toJSON())) as Array<String>;
    const sacrifices = avatarIds.slice(1, 5);

    const forgedDna = await new Promise<String>((resolve, _) => {
      api.tx.awesomeAvatars
        .forge(leaderId, sacrifices)
        .signAndSend(playerPair, async ({ txHash, status }) => {
          if (status.isFinalized) {
            sacrificed += sacrifices.length;
            let forgedDna = await getDna(api, leaderId);
            resolve(forgedDna);
          }
        });
    });

    if (currentDna !== forgedDna) {
      console.log(
        `forged DNA: ${forgedDna}, with ${sacrificed} sacrificed so far`
      );
      currentDna = forgedDna;
    }
  }
};

const getDna = async (api: ApiPromise, id: String): Promise<String> => {
  const [_, avatar] = await api.query.awesomeAvatars
    .avatars(id)
    .then((x) => x.toJSON() as Array<any>);
  return avatar.dna;
};

(async () => {
  await main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(`something went wrong: ${err}`);
      process.exit(1);
    });
})();
