import { ApiPromise, Keyring } from "@polkadot/api";
import { AddressOrPair } from "@polkadot/api/types";

type Extrinsic = {
  sudo: boolean;
  module_name: string;
  method_name: string;
  args: Array<unknown>;
  sender: AddressOrPair;
};

const promisifyExtrinsic = async (
  api: ApiPromise,
  extrinsic: Extrinsic
): Promise<void> => {
  const { sudo, module_name, method_name, args, sender } = extrinsic;
  let ext = api.tx[module_name][method_name](...args);
  ext = sudo ? api.tx.sudo.sudo(ext) : ext;
  return new Promise<void>((resolve, reject) => {
    ext.signAndSend(sender, { nonce: -1 }, ({ status, txHash }) => {
      if (status.isInBlock) {
        console.log(`Transaction included at blockHash ${status.asInBlock}`);
      } else if (status.isFinalized) {
        console.log(`Transaction finalized at blockHash ${status.asFinalized}`);
        // TODO: persist results to DB
        resolve();
      } else if (
        status.isInvalid ||
        status.isDropped ||
        status.isFinalityTimeout
      ) {
        // TODO: persist results to DB
        reject();
      }
    });
  });
};

export const batchExtrinsics = async (api: ApiPromise) => {
  // ): Promise<Array<void>> => {
  const keyring = new Keyring({ type: "sr25519" });
  const alice = keyring.addFromUri("//Alice");

  // TODO: read jobs from DB
  const jobs = [
    {
      sudo: true,
      module_name: "vesting",
      method_name: "vestedTransfer",
      args: [
        "5CPiHW4E3tN2k9iPBqadbMYaTEmrw8nCLw9PiVJg4E7GSr1C",
        { start: 10, period: 1, period_count: 5, per_period: 123 },
      ],
      sender: alice,
    },
    {
      sudo: true,
      module_name: "vesting",
      method_name: "vestedTransfer",
      args: [
        "5CoPGXyuK3TYcZdhm6jdoTqJRUk44JNR2jhcUhrJaXhzyNEi",
        { start: 15, period: 2, period_count: 3, per_period: 321 },
      ],
      sender: alice,
    },
  ];

  for (const job of jobs) {
    await promisifyExtrinsic(api, job);
  }

  // const extrinsics = jobs.map((job) => promisifyExtrinsic(api, job));
  // return Promise.all(extrinsics);
};
