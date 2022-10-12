import { ApiPromise } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/types";

const setOrganizer = async (
  api: ApiPromise,
  sudoPair: AddressOrPair,
  organizerAddress: AddressOrPair
): Promise<void> => {
  const existingOrganizer = await api.query.awesomeAvatars
    .organizer()
    .then((x) => x.toString());

  if (existingOrganizer !== organizerAddress) {
    await new Promise<void>((resolve, _) => {
      api.tx.sudo
        .sudo(api.tx.awesomeAvatars.setOrganizer(organizerAddress))
        .signAndSend(sudoPair, ({ status }) => {
          console.log(`setOrganizer: ${status}`);
          if (status.isFinalized) {
            resolve();
          }
        });
    });
  }
};

const upsertSeason = async (
  api: ApiPromise,
  organizerPair: AddressOrPair
): Promise<void> => {
  const season = {
    name: "Season 1",
    description: "This is the first season",
    earlyStart: 0,
    start: 1,
    end: 999_999,
    maxVariations: 6,
    maxComponents: 10,
    tiers: ["Common", "Rare", "Legendary"],
    pSingleMint: [100, 0],
    pBatchMint: [100, 0],
  };
  season.name = `0x${Buffer.from(season.name, "utf8").toString("hex")}`;
  season.description = `0x${Buffer.from(season.description, "utf8").toString(
    "hex"
  )}`;

  const existingSeason = await api.query.awesomeAvatars
    .seasons(1)
    .then((x) => x.toJSON());

  if (JSON.stringify(existingSeason) !== JSON.stringify(season)) {
    await new Promise<void>((resolve, _) => {
      api.tx.awesomeAvatars
        .upsertSeason(1, season)
        .signAndSend(organizerPair, ({ status }) => {
          console.log(`upsertSeason: ${status}`);
          if (status.isFinalized) {
            resolve();
          }
        });
    });
  }
};

const updateGlobalConfig = async (
  api: ApiPromise,
  organizerPair: AddressOrPair
): Promise<void> => {
  const globalConfig = {
    maxAvatarsPerPlayer: 4_294_967_295, // u32::MAX
    mint: {
      open: true,
      fees: {
        one: 1,
        three: 1,
        six: 1,
      },
      cooldown: 0,
      freeMintFeeMultiplier: 0,
      freeMintTransferFee: 0,
    },
    forge: {
      open: true,
      minSacrifices: 1,
      maxSacrifices: 4,
    },
    trade: {
      open: true,
    },
  };
  const currentConfig = await api.query.awesomeAvatars
    .globalConfigs()
    .then((x) => x.toJSON());

  if (JSON.stringify(currentConfig) !== JSON.stringify(globalConfig)) {
    await new Promise<void>((resolve, _) => {
      api.tx.awesomeAvatars
        .updateGlobalConfig(globalConfig)
        .signAndSend(organizerPair, ({ status }) => {
          console.log(`updateGlobalConfig: ${status}`);
          if (status.isFinalized) {
            resolve();
          }
        });
    });
  }
};

const issueFreeMints = async (
  api: ApiPromise,
  organizerPair: AddressOrPair,
  playerAddress: AddressOrPair
): Promise<void> => {
  const freeMints = 123;
  const existingFreeMints = await api.query.awesomeAvatars
    .freeMints(playerAddress)
    .then((x) => x.toJSON());

  if (existingFreeMints !== freeMints) {
    await new Promise<void>((resolve, _) => {
      api.tx.awesomeAvatars
        .issueFreeMints(playerAddress, freeMints)
        .signAndSend(organizerPair, ({ status }) => {
          console.log(`issueFreeMints: ${status}`);
          if (status.isFinalized) {
            resolve();
          }
        });
    });
  }
};

export const setup = async (
  api: ApiPromise,
  sudoPair: AddressOrPair,
  organizerPair: AddressOrPair,
  organizerAddress: AddressOrPair,
  playerAddress: AddressOrPair
): Promise<void> => {
  console.log("Started setting up");
  await setOrganizer(api, sudoPair, organizerAddress);
  await upsertSeason(api, organizerPair);
  await updateGlobalConfig(api, organizerPair);
  // await issueFreeMints(api, organizerPair, playerAddress);
  console.log("Finished setting up");
};

export const mint = async (
  api: ApiPromise,
  playerPair: AddressOrPair,
  batchSize: number = 1_000,
  batches: number = 10_000
): Promise<void> => {
  const mintBatch = Array(batchSize).fill(
    api.tx.awesomeAvatars.mint({ mintType: "Normal", count: "Six" })
  );

  for (let i = 0; i < batches; i++) {
    let tx = await new Promise<unknown>((resolve, _) => {
      api.tx.utility
        .batchAll(mintBatch)
        .signAndSend(playerPair, ({ txHash, status }) => {
          console.log(`mint: ${status}`);
          if (status.isInBlock) {
            resolve(txHash);
          }
        });
    });
    console.log(`i: ${i}, txHash: ${tx}`);
  }
};
