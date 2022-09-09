# Zodiac Roles SDK

This package offers an SDK for managing role permissions, based on presets.

## Permission presets

A preset is a permissions template tailored to a specific use case and chain.
An example would be the "Gnosis Chain DeFi Manage" preset, which enables risk-minimized interaction with the major DeFi protocols on Gnosis Chain.
When a preset is applied to a certain instance of a Roles modifier, the associated Avatar address is filled into preset for the respective placeholder values.
The resulting permissions are compared and diffed to the current permissions stored on the Roles modifier contract for that role.
Based on that, it calculates a set of permission update calls to patch the role configuration to the new desired target state.
These calls can finally be executed to apply the role permissions update.

We currently maintain four different preset:

- [Gnosis Chain DeFi Manage](./src/presets/gnosisChain/deFiManage.ts) Manage positions in DeFi protocols on Gnosis Chain
- [Gnosis Chain DeFi Harvest](./src/presets/gnosisChain/deFiHarvest.ts) Harvest rewards from DeFi protocols on Gnosis Chain
- [Mainnet DeFi Manage](./src/presets/mainnet/deFiManage.ts) Manage positions in DeFi protocols on Mainnet
- [Mainnet DeFi Harvest](./src/presets/mainnet/deFiHarvest.ts) Harvest rewards from DeFi protocols on Mainnet

## Playbook: Allow a Karpatkey role to call a new target

### Add transaction data to test

Copy the transaction data and paste it into the test transaction file for the respective preset:

- Gnosis Chain DeFi Manage: [./test/karpatkey/testTransactions/gnoManage.ts](./test/karpatkey/testTransactions/gnoManage.ts)
- Gnosis Chain DeFi Harvest: [./test/karpatkey/testTransactions/gnoHarvest.ts](./test/karpatkey/testTransactions/gnoHarvest.ts)
- Mainnet DeFi Manage: [./test/karpatkey/testTransactions/ethManage.ts](./test/karpatkey/testTransactions/ethManage.ts)
- Mainnet DeFi Harvest: [./test/karpatkey/testTransactions/ethHarvest.ts](./test/karpatkey/testTransactions/ethHarvest.ts)

Run the transaction simulation test with the following command:

```
yarn test:simulate <PRESET_ID>
```

For `<PRESET_ID>` insert respective value from: `gno:manage`, `gno:harvest`, `eth:manage` `eth:harvest`.

❌ The test is expected to fail, since the preset does not yet allow the newly added test transaction.

### Update preset

Go to the file for the preset and add a new target entry (or adjust one of the existing targets) to allow the new call.

- Gnosis Chain DeFi Manage: [./src/presets/gnosisChain/deFiManage.ts](./src/presets/gnosisChain/deFiManage.ts)
- Gnosis Chain DeFi Harvest: [./src/presets/gnosisChain/deFiHarvest.ts](./src/presets/gnosisChain/deFiHarvest.ts)
- Mainnet DeFi Manage: [./src/presets/mainnet/deFiManage.ts](./src/presets/mainnet/deFiManage.ts)
- Mainnet DeFi Harvest: [./src/presets/mainnet/deFiHarvest.ts](./src/presets/mainnet/deFiHarvest.ts)

Now run the test again, to confirm that the transaction is allowed:

```
yarn test:simulate <PRESET_ID>
```

For `<PRESET_ID>` insert the respective value from: `gno:manage`, `gno:harvest`, `eth:manage` `eth:harvest`.

✅ The test should now succeed.

### Patch role permissions

Now it's time to apply the updated preset to the Karpatkey role.
This happens via the following command:

```
yarn apply:<ENTITY>:<CHAIN>:<ROLE>
```

- `<ENTITY>`: `dao` for Gnosis DAO, `ltd` for Gnosis Limited
- `<CHAIN>`: `eth` for Mainnet, `gno` for Gnosis Chain
- `<ROLE>`: `manage` for the DeFi Manage role 1, `harvest` for the DeFi Harvest role 2

For example to apply an update of the Gnosis Chain DeFi Harvest role to the Gnosis DAO Safe on Gnosis Chain, run the following command:

```
yarn apply:dao:gno:harvest
```

Running this command writes a JSON file to sdk/txData.json.
Upload this file into the Transaction Builder Safe app to execute the role permissions updates as a multi-send transaction.
