import { ApiPromise, Keyring, WsProvider } from "@polkadot/api";

export const createApi = async (wsAddr?: string): Promise<ApiPromise> => {
  const provider = new WsProvider(wsAddr);
  return ApiPromise.create({
    provider,
    types: {
      VestingSchedule: {
        start: "BlockNumber",
        period: "BlockNumber",
        period_count: "u32",
        per_period: "Balance",
      },
    },
  })
    .then((api) => {
      console.log(`Successfully connected to ${wsAddr}`);
      return api;
    })
    .catch((err) => {
      console.error(`Failed to connect to ${wsAddr}`);
      throw new Error(err);
    });
};
