# Changelog

## [4.1.1](https://github.com/gnosisguild/zodiac-modifier-roles/compare/zodiac-roles-sdk-v4.1.0...zodiac-roles-sdk-v4.1.1) (2026-08-25)


### Bug Fixes

* **sdk:** explain a bytes32 key that holds no packed label ([#508](https://github.com/gnosisguild/zodiac-modifier-roles/issues/508)) ([b4b5a02](https://github.com/gnosisguild/zodiac-modifier-roles/commit/b4b5a027f36f93b870c9adf2c1c282d7de73f3d1))

## [4.1.0](https://github.com/gnosisguild/zodiac-modifier-roles/compare/zodiac-roles-sdk-v4.0.0...zodiac-roles-sdk-v4.1.0) (2026-08-25)


### Features

* **sdk:** accept a plain label wherever an allowance key is taken ([#506](https://github.com/gnosisguild/zodiac-modifier-roles/issues/506)) ([2fdf408](https://github.com/gnosisguild/zodiac-modifier-roles/commit/2fdf40851b5273c9525600c920022acb71152cef))


### Bug Fixes

* **app:** reliable RPC for all chains + record-apply & wallet fixes ([#499](https://github.com/gnosisguild/zodiac-modifier-roles/issues/499)) ([81426d0](https://github.com/gnosisguild/zodiac-modifier-roles/commit/81426d0a86309e9f84ad2d3ed4fad0725fd49a65))

## [4.0.0](https://github.com/gnosisguild/zodiac-modifier-roles/compare/zodiac-roles-sdk-v3.4.8...zodiac-roles-sdk-v4.0.0) (2026-05-28)


### ⚠ BREAKING CHANGES

* removes from the sdk public API: planApply, planApplyRole, planExtendRole, callsPlannedForApply, callsPlannedForApplyRole, encodeCalls, and the Call type. The internal target/diff and target/calls modules become dead code and are deleted with them.

### Features

* SDK v4 — sunset deployments package and prune apply API ([#480](https://github.com/gnosisguild/zodiac-modifier-roles/issues/480)) ([3a05b49](https://github.com/gnosisguild/zodiac-modifier-roles/commit/3a05b490a866de8d59995efb55de72dd774c4720))

## [3.4.8](https://github.com/gnosisguild/zodiac-modifier-roles/compare/zodiac-roles-sdk-v3.4.7...zodiac-roles-sdk-v3.4.8) (2026-04-09)


### Bug Fixes

* add buffer to order validDuration to make it instantly valid ([#475](https://github.com/gnosisguild/zodiac-modifier-roles/issues/475)) ([21d4e4d](https://github.com/gnosisguild/zodiac-modifier-roles/commit/21d4e4dc46d5b3cc3bda2c040ec3d0aeb2a3d791))
* pass receiver to postCowOrderApi ([#476](https://github.com/gnosisguild/zodiac-modifier-roles/issues/476)) ([2da8d22](https://github.com/gnosisguild/zodiac-modifier-roles/commit/2da8d223103eb5d41df84de3affd0bf6312c6c98))

## [3.4.7](https://github.com/gnosisguild/zodiac-modifier-roles/compare/zodiac-roles-sdk-v3.4.6...zodiac-roles-sdk-v3.4.7) (2026-03-12)


### Bug Fixes

* don't diff against dynamically updated allowance fields ([#470](https://github.com/gnosisguild/zodiac-modifier-roles/issues/470)) ([ec71323](https://github.com/gnosisguild/zodiac-modifier-roles/commit/ec71323d7e66c13075149f98a23b16c9f68576b3))

## [3.4.6](https://github.com/gnosisguild/zodiac-modifier-roles/compare/zodiac-roles-sdk-v3.4.5...zodiac-roles-sdk-v3.4.6) (2026-03-10)


### Bug Fixes

* properly handle license expired error ([#468](https://github.com/gnosisguild/zodiac-modifier-roles/issues/468)) ([94954b5](https://github.com/gnosisguild/zodiac-modifier-roles/commit/94954b55a90677103c67e9e6baccdfec758f1aa1))
* **sdk:** use correct compValue for CallWithinAllowance in applyOptions ([#464](https://github.com/gnosisguild/zodiac-modifier-roles/issues/464)) ([d39eccc](https://github.com/gnosisguild/zodiac-modifier-roles/commit/d39eccc9b93bb2370072dcfcd85128671a4a6dda))

## [3.4.5](https://github.com/gnosisguild/zodiac-modifier-roles/compare/zodiac-roles-sdk-v3.4.4...zodiac-roles-sdk-v3.4.5) (2026-02-27)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * zodiac-roles-deployments bumped to 3.3.0

## [3.4.4](https://github.com/gnosisguild/zodiac-modifier-roles/compare/zodiac-roles-sdk-v3.4.3...zodiac-roles-sdk-v3.4.4) (2026-02-24)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * zodiac-roles-deployments bumped to 3.2.3

## [3.4.3](https://github.com/gnosisguild/zodiac-modifier-roles/compare/zodiac-roles-sdk-v3.4.2...zodiac-roles-sdk-v3.4.3) (2026-02-23)


### Bug Fixes

* disable broken targetIntegrity checks in SDK again ([#449](https://github.com/gnosisguild/zodiac-modifier-roles/issues/449)) ([92eadf8](https://github.com/gnosisguild/zodiac-modifier-roles/commit/92eadf8e419ada3d2b94c559656357efe8cf1e43))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * zodiac-roles-deployments bumped to 3.2.2

## [3.4.2](https://github.com/gnosisguild/zodiac-modifier-roles/compare/zodiac-roles-sdk-v3.4.1...zodiac-roles-sdk-v3.4.2) (2026-02-19)


### Bug Fixes

* ban `Nor`, `ArraySome`, `ArraySubset` operators ([#446](https://github.com/gnosisguild/zodiac-modifier-roles/issues/446)) ([458b13b](https://github.com/gnosisguild/zodiac-modifier-roles/commit/458b13b2d039c99b779a2ca221a3debd3cbf29e1))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * zodiac-roles-deployments bumped to 3.2.1

## [3.4.1](https://github.com/gnosisguild/zodiac-modifier-roles/compare/zodiac-roles-sdk-v3.4.0...zodiac-roles-sdk-v3.4.1) (2026-01-22)


### Bug Fixes

* swap ETH to WETH does not need cow order signing permissions ([#433](https://github.com/gnosisguild/zodiac-modifier-roles/issues/433)) ([5b32ce8](https://github.com/gnosisguild/zodiac-modifier-roles/commit/5b32ce8c0685d06eb354971483f99ac33a447790))

## [3.4.0](https://github.com/gnosisguild/zodiac-modifier-roles/compare/zodiac-roles-sdk-v3.3.3...zodiac-roles-sdk-v3.4.0) (2026-01-21)


### Features

* swap native tokens ([#431](https://github.com/gnosisguild/zodiac-modifier-roles/issues/431)) ([783eb75](https://github.com/gnosisguild/zodiac-modifier-roles/commit/783eb75b92f613220f27ac43e96aed588f559591))

## [3.3.3](https://github.com/gnosisguild/zodiac-modifier-roles/compare/zodiac-roles-sdk-v3.3.2...zodiac-roles-sdk-v3.3.3) (2026-01-15)


### Bug Fixes

* update all zodiac.eco links ([#428](https://github.com/gnosisguild/zodiac-modifier-roles/issues/428)) ([25889fb](https://github.com/gnosisguild/zodiac-modifier-roles/commit/25889fb13ce4171072e5ebe13bd12c38537289ff))
* update zodiac URL ([000f714](https://github.com/gnosisguild/zodiac-modifier-roles/commit/000f714188d047e47e57404ebdf46f98bb8d492a))

## [3.3.2](https://github.com/gnosisguild/zodiac-modifier-roles/compare/zodiac-roles-sdk-v3.3.1...zodiac-roles-sdk-v3.3.2) (2025-10-21)


### Bug Fixes

* fix the npm publish ci job ([#391](https://github.com/gnosisguild/zodiac-modifier-roles/issues/391)) ([e2ea984](https://github.com/gnosisguild/zodiac-modifier-roles/commit/e2ea98488424cc81d7837e899cc6c79677d2976f))

## [3.3.1](https://github.com/gnosisguild/zodiac-modifier-roles/compare/zodiac-roles-sdk-v3.3.0...zodiac-roles-sdk-v3.3.1) (2025-10-21)


### Bug Fixes

* in some cases the kit `allow` export is not correctly created (`default` among ethSdk exports) ([#390](https://github.com/gnosisguild/zodiac-modifier-roles/issues/390)) ([afc04a7](https://github.com/gnosisguild/zodiac-modifier-roles/commit/afc04a7f08b114142d2ed3108eed02140a19d7a9))
* roles interface used in `encodeSignOrderWithRole` ([#387](https://github.com/gnosisguild/zodiac-modifier-roles/issues/387)) ([f087de3](https://github.com/gnosisguild/zodiac-modifier-roles/commit/f087de3517f930e60379414dc9c4313df5d81c24))

## [3.3.0](https://github.com/gnosisguild/zodiac-modifier-roles/compare/zodiac-roles-sdk-v3.2.5...zodiac-roles-sdk-v3.3.0) (2025-10-10)


### Features

* add Scroll, Flare, Plasma ([#386](https://github.com/gnosisguild/zodiac-modifier-roles/issues/386)) ([285ca9b](https://github.com/gnosisguild/zodiac-modifier-roles/commit/285ca9b461cde7404506445b552e0371954139f7))
* apply via governor and rethink factory ([#381](https://github.com/gnosisguild/zodiac-modifier-roles/issues/381)) ([11a9a54](https://github.com/gnosisguild/zodiac-modifier-roles/commit/11a9a54f5e4ba87be175900b1ac6dfafb0b37c9d))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * zodiac-roles-deployments bumped to 3.2.0

## [3.2.5](https://github.com/gnosisguild/zodiac-modifier-roles/compare/zodiac-roles-sdk-v3.2.4...zodiac-roles-sdk-v3.2.5) (2025-08-28)


### Bug Fixes

* add proper esm module support ([ab017a1](https://github.com/gnosisguild/zodiac-modifier-roles/commit/ab017a1a79cb3c0e295d96f9cdb081ef6365d02f))
* esm compat handling of openapi-backend peer dep ([#376](https://github.com/gnosisguild/zodiac-modifier-roles/issues/376)) ([e3b9d9b](https://github.com/gnosisguild/zodiac-modifier-roles/commit/e3b9d9bbc5d171b50cf2acd89dd266f0ddb5367a))
* types exports ([#378](https://github.com/gnosisguild/zodiac-modifier-roles/issues/378)) ([e3f5226](https://github.com/gnosisguild/zodiac-modifier-roles/commit/e3f52267b775ad545eef7c6cc4a0a37eed95ecf6))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * zodiac-roles-deployments bumped to 3.1.2

## [3.2.4](https://github.com/gnosisguild/zodiac-modifier-roles/compare/zodiac-roles-sdk-v3.2.3...zodiac-roles-sdk-v3.2.4) (2025-08-22)


### Bug Fixes

* add proper esm module support ([ab017a1](https://github.com/gnosisguild/zodiac-modifier-roles/commit/ab017a1a79cb3c0e295d96f9cdb081ef6365d02f))
* esm compat handling of openapi-backend peer dep ([#376](https://github.com/gnosisguild/zodiac-modifier-roles/issues/376)) ([e3b9d9b](https://github.com/gnosisguild/zodiac-modifier-roles/commit/e3b9d9bbc5d171b50cf2acd89dd266f0ddb5367a))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * zodiac-roles-deployments bumped to 3.1.1
