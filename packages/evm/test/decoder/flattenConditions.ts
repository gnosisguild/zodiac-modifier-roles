import { ConditionFlatStruct } from "../../typechain-types/contracts/packers/Packer";

export const flattenCondition = (root: any): ConditionFlatStruct[] => {
  const result: ConditionFlatStruct[] = [];
  const queue = [{ condition: root, parent: 0 }];

  while (queue.length > 0) {
    const {
      condition: { children, ...conditionFlat },
      parent,
    } = queue.shift()!;

    result.push({ compValue: "0x", ...conditionFlat, parent });
    const index = result.length - 1;

    if (children) {
      for (const child of children) {
        queue.push({ condition: child, parent: index });
      }
    }
  }

  if (result.length > 256) {
    console.warn(
      "Condition tree has more than 256 nodes. It will not be possible to apply this permission to the Roles mod."
    );
  }

  return result;
};
