import { TypedData } from "abitype";

import { parseType } from "./parseType";

export function allTypes(types: TypedData, entrypoints: string[]) {
  const result: string[] = [];
  let queue = [...entrypoints];

  while (queue.length) {
    const type = queue.shift()!;

    if (result.includes(type)) {
      continue;
    }

    result.push(type);
    const { type: baseType } = parseType(type);

    queue = queue.concat(
      baseType,
      (types[baseType] || []).map((field) => field.type),
    );
  }

  return result;
}
