import { Contract, Signer } from "ethers";
import { defaultAbiCoder, solidityPack } from "ethers/lib/utils";

import ROLES_ABI from "../../build/artifacts/contracts/Roles.sol/Roles.json";
import { Roles } from "../../typechain-types";

import { AVATAR_ADDRESS_PLACEHOLDER } from "./placeholders";
import {
  AllowFunction,
  Comparison,
  ExecutionOptions,
  ParameterType,
  RolePreset,
  ScopeParam,
} from "./types";

let nonce: number;

/**
 * Updates a role, setting all permissions of the given preset
 *
 * @param address The address of the roles modifier
 * @param roleId ID of the role to update
 * @param preset: Permissions preset to apply
 */
const applyPreset = async (
  /// address of the roles modifier
  address: string,
  roleId: number,
  preset: RolePreset,
  signer: Signer,
  avatar?: string
): Promise<void> => {
  const contract = new Contract(address, ROLES_ABI.abi, signer) as Roles;

  const avatarAddress = avatar || (await contract.avatar());
  const filledPreset = fillPlaceholders(preset, avatarAddress);
  console.log(`Using ${avatarAddress} for avatar address placeholders.`);

  nonce = await signer.getTransactionCount();

  await makeAllowTargetCalls(roleId, filledPreset, contract);

  await makeScopeTargetCalls(roleId, filledPreset, contract);

  await makeScopeAllowFunctionCalls(roleId, filledPreset, contract);

  await makeScopeSignatureCalls(roleId, filledPreset, contract);

  await makeScopeParameterAsOneOfCalls(roleId, filledPreset, contract);
};

export default applyPreset;

const fillPlaceholders = (preset: RolePreset, avatarAddress: string) => ({
  ...preset,
  allowFunctions: preset.allowFunctions.map((allowFunction) => ({
    ...allowFunction,
    params: (allowFunction.params || []).map(
      (param) =>
        param && {
          ...param,
          value: fillPlaceholdersValue(param.value, avatarAddress),
        }
    ),
  })),
});

const fillPlaceholdersValue = (
  value: ScopeParam["value"],
  avatarAddress: string
) => {
  const encodedAddress = defaultAbiCoder.encode(["address"], [avatarAddress]);

  if (value === AVATAR_ADDRESS_PLACEHOLDER) {
    return encodedAddress;
  }
  if (Array.isArray(value)) {
    return value.map((entry) =>
      entry === AVATAR_ADDRESS_PLACEHOLDER ? encodedAddress : entry
    );
  }

  return value;
};

type RolesPresetFilled = ReturnType<typeof fillPlaceholders>;

const ExecutionOptionLabel = {
  [ExecutionOptions.None]: "call",
  [ExecutionOptions.DelegateCall]: "call, delegatecall",
  [ExecutionOptions.Send]: "call, send",
  [ExecutionOptions.Both]: "call, delegatecall, send",
};

const ComparisonLabel = {
  [Comparison.EqualTo]: "",
  [Comparison.GreaterThan]: ">",
  [Comparison.LessThan]: "<",
};

async function makeAllowTargetCalls(
  roleId: number,
  preset: RolesPresetFilled,
  contract: Roles
) {
  await Promise.all(
    preset.allowTargets.map(
      async ({ targetAddress, options = ExecutionOptions.None }) => {
        await contract.allowTarget(roleId, targetAddress, options, {
          nonce: nonce++,
        });
        console.log(
          `✔️ Allow ${ExecutionOptionLabel[options]} to any function of ${targetAddress}`
        );
      }
    )
  );
}

async function makeScopeTargetCalls(
  roleId: number,
  preset: RolesPresetFilled,
  contract: Roles
) {
  // Every single function scoping, either: functionAllow, functionScope, parameterScope and parameterScopeAsOneOf
  // requires a preceding scopeTarget
  await Promise.all(
    preset.allowFunctions
      .flatMap((af) => af.targetAddresses)
      .map(async (targetAddress) => {
        await contract.scopeTarget(roleId, targetAddress, {
          nonce: nonce++,
        });
        console.log(`✔️ Allow calls to select functions of ${targetAddress}`);
      })
  );
}

async function makeScopeAllowFunctionCalls(
  roleId: number,
  preset: RolesPresetFilled,
  contract: Roles
) {
  await Promise.all(
    preset.allowFunctions.map(async (allowFunction) => {
      if (needsScopeAllowFunctionCall(allowFunction)) {
        const {
          targetAddresses,
          functionSig,
          options = ExecutionOptions.None,
        } = allowFunction;

        await Promise.all(
          targetAddresses.map((targetAddress) =>
            contract.scopeAllowFunction(
              roleId,
              targetAddress,
              functionSig,
              options,
              {
                nonce: nonce++,
              }
            )
          )
        );

        console.log(
          `✔️ Allow ${
            ExecutionOptionLabel[options]
          } to ${functionSig} function of:\n${logList(targetAddresses)}`
        );
      }
    })
  );
}

async function makeScopeSignatureCalls(
  roleId: number,
  preset: RolesPresetFilled,
  contract: Roles
) {
  preset.allowFunctions
    .filter(needsScopeSignatureCall)
    .map(async (allowFunction, i) => {
      const {
        targetAddresses,
        functionSig,
        options = ExecutionOptions.None,
        params = [],
      } = allowFunction;

      // Note we exclude oneOf parameters. These will be set independently later
      const paramsWithoutOneOf = params.map((param) =>
        param?.comparison !== Comparison.OneOf ? param : undefined
      );

      // extract arguments
      const isParamScoped = paramsWithoutOneOf.map(Boolean);
      const paramType = paramsWithoutOneOf.map(
        (entry) => entry?.type || ParameterType.Static
      );
      const paramComp = paramsWithoutOneOf.map(
        (entry) => entry?.comparison || Comparison.EqualTo
      );
      const compValue = paramsWithoutOneOf.map(
        (entry) => (entry?.value as string) || "0x"
      );

      await Promise.all(
        targetAddresses.map((targetAddress) =>
          contract.scopeFunction(
            roleId,
            targetAddress,
            functionSig,
            isParamScoped,
            paramType,
            paramComp,
            compValue,
            options,
            {
              nonce: nonce++,
            }
          )
        )
      );
      console.log(
        `✔️ Allow ${
          ExecutionOptionLabel[options]
        } to ${functionSig} function with params (${logParams(
          paramsWithoutOneOf
        )}) of:\n${logList(targetAddresses)}`
      );
    });
}

async function makeScopeParameterAsOneOfCalls(
  roleId: number,
  preset: RolesPresetFilled,
  contract: Roles
) {
  await Promise.all(
    preset.allowFunctions.map(async (allowFunction) => {
      const {
        targetAddresses,
        functionSig,
        options = ExecutionOptions.None,
        params,
      } = allowFunction;

      // If there are other scoped params, we've already set the ExecutionOptions in makeScopeSignatureCalls
      const hasPerformedScopeSignatureCalls =
        countParams(allowFunction).scopedCount > 0;
      const needsScopeFunctionExecutionOptions =
        options != ExecutionOptions.None && !hasPerformedScopeSignatureCalls;

      await Promise.all(
        params.map(async (param, paramIndex) => {
          // skip any params that are not scoped as oneOf
          if (param?.comparison !== Comparison.OneOf) return;

          await Promise.all(
            targetAddresses.map(async (targetAddress) => {
              if (needsScopeFunctionExecutionOptions) {
                await contract.scopeFunctionExecutionOptions(
                  roleId,
                  targetAddress,
                  functionSig,
                  options,
                  {
                    nonce: nonce++,
                  }
                );
              }

              await contract.scopeParameterAsOneOf(
                roleId,
                targetAddress,
                functionSig,
                paramIndex,
                param.type,
                param.value as string[],
                {
                  nonce: nonce++,
                }
              );
            })
          );

          if (hasPerformedScopeSignatureCalls) {
            console.log(
              `✔️ Narrow earlier allowance of ${
                ExecutionOptionLabel[options]
              } to ${functionSig} function: must now use params (${logParams(
                params
              )}) of:\n${logList(targetAddresses)}`
            );
          } else {
            console.log(
              `✔️ Allow ${
                ExecutionOptionLabel[options]
              } to ${functionSig} function with params (${logParams(
                params
              )}) of:\n${logList(targetAddresses)}`
            );
          }
        })
      );
    })
  );
}

function needsScopeAllowFunctionCall(allowFunction: AllowFunction): boolean {
  const { scopedCount, scopedOneOfCount } = countParams(allowFunction);
  return scopedCount + scopedOneOfCount === 0;
}

function needsScopeSignatureCall(allowFunction: AllowFunction): boolean {
  const { scopedCount } = countParams(allowFunction);
  return scopedCount > 0;
}

function countParams({ params = [] }: AllowFunction) {
  const scopedParams = params.filter(Boolean) as ScopeParam[];
  return {
    scopedCount: scopedParams.filter(
      (entry) => entry.comparison !== Comparison.OneOf
    ).length,
    scopedOneOfCount: scopedParams.filter(
      (entry) => entry.comparison === Comparison.OneOf
    ).length,
  };
}

const logList = (addresses: string[]) =>
  addresses.map((address) => `  - ${address}`).join("\n");

const logParams = (params: (ScopeParam | undefined)[]) =>
  params
    .map((param) => {
      if (!param) return "any";
      if (param.comparison === Comparison.OneOf)
        return `${(param.value as string[]).join(" | ")}`;
      return `${ComparisonLabel[param.comparison]}${param.value as string}`;
    })
    .join(", ");
