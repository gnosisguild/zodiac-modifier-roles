// Loads @gnosis-guild/zodiac-core via native ESM dynamic import.
// The package is "type":"module" with no CJS build, and our tsconfig targets
// commonjs — under which `await import(...)` is transpiled to require().
// Wrapping with new Function preserves the native import() at runtime.
type ZodiacCore = typeof import("@gnosis-guild/zodiac-core");

const _esmImport = new Function("p", "return import(p)") as (
  p: string,
) => Promise<ZodiacCore>;

export const loadZodiacCore = (): Promise<ZodiacCore> =>
  _esmImport("@gnosis-guild/zodiac-core");
