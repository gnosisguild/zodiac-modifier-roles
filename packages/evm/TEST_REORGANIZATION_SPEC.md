# Test Suite Reorganization Specification

## Goals

**Primary objective**: Maximize coverage visibility - make it easy to verify that all functionality has corresponding tests.

**Coverage depth targets**:

- Every public/external function has at least one test
- Every error condition/revert path is explicitly tested
- Every logical branch in complex functions is exercised
- Edge cases and boundary conditions are tested

## Prerequisites

None. This reorganization starts from a **blank slate** - designing tests based on analyzing the codebase, not copying existing tests. Coverage audits happen after Phase 2 to identify remaining gaps.

## Target Structure

```
test/
├── setup.ts                          # Centralized test utilities (kept as-is)
├── utils.ts                          # Shared constants and helpers (kept as-is)
│
├── operators/                        # Individual operator tests (existing structure)
│   ├── 00Pass.spec.ts               # Numbered to match Operator enum
│   ├── 01And.spec.ts
│   ├── 02Or.spec.ts
│   ├── ...
│   ├── 05Matches.spec.ts            # Absorbs MatchLeadingBytes + AbiEncodedLeadingBytes tests
│   └── 30CallWithinAllowance.spec.ts
│
├── adapters/                         # Periphery/extension tests
│   ├── multisend-unwrapper.spec.ts
│   └── avatar-erc721-owner.spec.ts
│
├── decoder/                          # AbiDecoder internals
│   ├── overflow.spec.ts
│   └── plucking.spec.ts
│
├── serialization/                    # Domain 6: Condition serialization subsystem
│   ├── integrity.spec.ts            # Condition tree validation
│   ├── type-tree.spec.ts            # Type tree inspection and matching
│   ├── topology.spec.ts             # Tree structure validation
│   └── packer-unpacker.spec.ts      # Condition packing/unpacking round-trips
│
├── role-management.spec.ts           # Domain 1: Role/Member management
├── scoping.spec.ts                   # Domain 2: Permission/Clearance configuration
├── condition-evaluation.spec.ts      # Domain 3: Condition tree evaluation (runtime)
├── allowance-tracking.spec.ts        # Domain 4: Allowance consumption, accrual, limits
├── transaction-execution.spec.ts     # Domain 5: All exec* entry points, reentrancy, bundles
│
└── onlyOwner.spec.ts                 # All owner-restricted function tests (self-contained)
```

## Organization Principles

### 1. Behavior-Centric Domains

Tests are organized by **user-facing behavior**, not contract architecture. The 6 domains are:

| Domain                       | Location                        | Covers                                                                                                                                                                                                                         |
| ---------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Role/Member Management       | `role-management.spec.ts`       | granting/revoking roles, membership validity windows, usage limits, default roles                                                                                                                                              |
| Permission/Clearance Scoping | `scoping.spec.ts`               | **Configuration APIs only**: allowTarget, allowFunction, revokeTarget, revokeFunction, clearance level setting. Permission **checking** during execution goes in `transaction-execution.spec.ts`                               |
| Condition Evaluation         | `condition-evaluation.spec.ts`  | runtime condition tree evaluation, type matching, parameter constraint checking                                                                                                                                                |
| Allowance Tracking           | `allowance-tracking.spec.ts`    | consumption, accrual, refill periods, value/call limits, multi-entrypoint allowance                                                                                                                                            |
| Transaction Execution        | `transaction-execution.spec.ts` | execTransactionFromModule, execTransactionWithRole, return data variants, reentrancy, bundle handling, ExecutionOptions (send/delegatecall), **permission checking during execution** (target allowed, function allowed, etc.) |
| Serialization                | `serialization/` folder         | integrity validation, type tree inspection, topology validation, condition packing/unpacking round-trips                                                                                                                       |
| Owner Access Control         | `onlyOwner.spec.ts`             | all owner-restricted function tests (self-contained with both success and failure cases)                                                                                                                                       |

### 2. Separation by Phase

Write-time validation (integrity checks) and runtime evaluation (condition logic) are **separate concerns** kept in distinct locations:

- Validation/integrity tests → `serialization/` folder
- Runtime evaluation tests → `condition-evaluation.spec.ts` + `operators/`

### 3. Flat Structure with Descriptive Naming

- No nested subfolders except for **operators/**, **adapters/**, **decoder/**, and **serialization/**
- File names are simple and descriptive (no phase prefixes)
- Self-documenting: file names tell you exactly what's tested

### 4. Split by Concern, Not by Size

Large files covering **one concern thoroughly** stay together (e.g., Integrity tests).
Files covering **multiple unrelated things** get split (e.g., Misc.spec.ts tests redistributed to appropriate domains).

### 5. Subfolders for Specialized Test Categories

| Subfolder        | Rationale                                                                   |
| ---------------- | --------------------------------------------------------------------------- |
| `operators/`     | 20+ files testing individual operators, numbered to match enum              |
| `adapters/`      | Optional periphery extensions, separate from core                           |
| `decoder/`       | Technical implementation tests, not user-facing behavior                    |
| `serialization/` | Condition serialization subsystem (integrity, type tree, topology, packing) |

### 6. Error Testing Strategy

Error/revert cases are tested **implicitly within feature tests** - colocated with the functionality they test. Each feature file includes both success and failure scenarios. No dedicated error file.

## Migration Guidelines

### Tests to Redistribute

| Old File                         | Target Location(s)                                                    |
| -------------------------------- | --------------------------------------------------------------------- |
| `Roles.spec.ts`                  | Split across: `role-management`, `transaction-execution`              |
| `Membership.spec.ts`             | `role-management.spec.ts`                                             |
| `Clearance.spec.ts`              | `scoping.spec.ts`                                                     |
| `Allowance.spec.ts`              | `allowance-tracking.spec.ts` (all sections including multiEntrypoint) |
| `AllowanceAccrual.spec.ts`       | `allowance-tracking.spec.ts`                                          |
| `ExecutionOptions.spec.ts`       | `transaction-execution.spec.ts`                                       |
| `TransactionBundle.spec.ts`      | `transaction-execution.spec.ts`                                       |
| `Operator.spec.ts`               | Merge into `operators/` (dedupe with existing files)                  |
| `Integrity.spec.ts`              | `serialization/integrity.spec.ts` (keep cohesive)                     |
| `TypeTree.spec.ts`               | `serialization/type-tree.spec.ts`                                     |
| `Topology.spec.ts`               | `serialization/topology.spec.ts`                                      |
| `PackerUnpacker.spec.ts`         | `serialization/packer-unpacker.spec.ts`                               |
| `MatchLeadingBytes.spec.ts`      | `operators/05Matches.spec.ts`                                         |
| `AbiEncodedLeadingBytes.spec.ts` | `operators/05Matches.spec.ts`                                         |
| `Misc.spec.ts`                   | Redistribute all tests to appropriate domains (remains in old/)       |
| `OnlyOwner.spec.ts`              | `onlyOwner.spec.ts`                                                   |
| `EmitsEvent.spec.ts`             | Colocate event assertions with each feature's tests                   |
| `Setup.spec.ts`                  | **Skip** - no deployment testing (remains in old/)                    |
| `FactoryFriendly.spec.ts`        | **Skip** - no deployment testing (remains in old/)                    |
| `Modifier.spec.ts`               | **Skip** - no deployment testing (remains in old/)                    |
| `decoder/Overflow.spec.ts`       | `decoder/overflow.spec.ts`                                            |
| `decoder/Plucking.spec.ts`       | `decoder/plucking.spec.ts`                                            |
| `adapters/*`                     | `adapters/` (rename to kebab-case)                                    |

### Operator Test Integration

1. Keep `operators/` folder with numbered convention
2. Merge `Operator.spec.ts` content into individual operator files
3. Absorb `MatchLeadingBytes.spec.ts` and `AbiEncodedLeadingBytes.spec.ts` into `05Matches.spec.ts`
4. Deduplicate any redundant tests

## Implementation Phases

### Phase 1: Design Test Structure from Scratch

**Approach**: Analyze the codebase to design the ideal test structure. This is a **blank slate** design process, not a copy-paste of existing test titles.

**Process for each target file**:

1. **Analyze the code**: Read the relevant contracts/functions to understand what behaviors need testing
2. **Design test cases**: Create `it.skip()` placeholders for every scenario that should be tested:
   - Happy paths (expected usage)
   - Error conditions (reverts, edge cases)
   - Boundary conditions
   - State transitions
3. **Write clear descriptions**: Test titles should be self-documenting and describe the expected behavior
4. **Reference old/ for inspiration**: The existing tests in `old/` can inform what was previously covered, but are not the source of truth

**Files to create**:

- `serialization/integrity.spec.ts`
- `serialization/type-tree.spec.ts`
- `serialization/topology.spec.ts`
- `serialization/packer-unpacker.spec.ts`
- `role-management.spec.ts`
- `scoping.spec.ts`
- `condition-evaluation.spec.ts`
- `allowance-tracking.spec.ts`
- `transaction-execution.spec.ts`
- `onlyOwner.spec.ts`
- `decoder/overflow.spec.ts`
- `decoder/plucking.spec.ts`
- `adapters/multisend-unwrapper.spec.ts`
- `adapters/avatar-erc721-owner.spec.ts`

**Each file contains**:

- Import statements
- `describe` blocks organized by feature/behavior
- `it.skip()` placeholders with **clear, descriptive titles**
- For tests merging into **existing files** (e.g., `operators/05Matches.spec.ts`), add new `describe` blocks

Example placeholder:

```typescript
describe("Membership", () => {
  describe("Validity window", () => {
    it.skip(
      "reverts with MembershipNotYetValid when current time is before start",
    );
    it.skip("reverts with MembershipExpired when current time is after end");
    it.skip("succeeds when current time is exactly at start boundary");
    it.skip("succeeds when current time is exactly at end boundary");
  });
});
```

**Commit**: One commit per file created, e.g., "scaffold: design role-management test structure"

### Phase 2: Implement Test Cases

Implement the test cases designed in Phase 1. For each `it.skip()` placeholder, write the actual test implementation.

**Process**:

1. Reference `old/` tests for implementation patterns, fixtures, and assertions
2. Adapt and improve implementations as needed (don't blindly copy)
3. Remove `.skip` as each test is implemented
4. Add any additional test cases discovered during implementation

**Reference mapping** (old/ files to consult for each target):

| Target File                             | Reference Files in old/                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------- |
| `role-management.spec.ts`               | `Membership.spec.ts`, `Roles.spec.ts` (role parts)                                    |
| `transaction-execution.spec.ts`         | `Roles.spec.ts` (exec parts), `ExecutionOptions.spec.ts`, `TransactionBundle.spec.ts` |
| `scoping.spec.ts`                       | `Clearance.spec.ts`                                                                   |
| `allowance-tracking.spec.ts`            | `Allowance.spec.ts`, `AllowanceAccrual.spec.ts`                                       |
| `condition-evaluation.spec.ts`          | `Misc.spec.ts` (condition parts)                                                      |
| `onlyOwner.spec.ts`                     | `OnlyOwner.spec.ts`                                                                   |
| `serialization/integrity.spec.ts`       | `Integrity.spec.ts`                                                                   |
| `serialization/type-tree.spec.ts`       | `TypeTree.spec.ts`                                                                    |
| `serialization/topology.spec.ts`        | `Topology.spec.ts`                                                                    |
| `serialization/packer-unpacker.spec.ts` | `PackerUnpacker.spec.ts`                                                              |
| `decoder/overflow.spec.ts`              | `decoder/Overflow.spec.ts`                                                            |
| `decoder/plucking.spec.ts`              | `decoder/Plucking.spec.ts`                                                            |
| `adapters/multisend-unwrapper.spec.ts`  | `adapters/MultiSendUnwrapper.spec.ts`                                                 |
| `adapters/avatar-erc721-owner.spec.ts`  | `adapters/AvatarIsOwnerOfERC721.spec.ts`                                              |
| `operators/05Matches.spec.ts`           | `MatchLeadingBytes.spec.ts`, `AbiEncodedLeadingBytes.spec.ts`                         |

**Important**:

- Do NOT delete, remove, or rename any files in `old/`. They remain for coverage comparison.
- During migration, you may skip tests in `old/` (e.g., using `.skip` or test config) to avoid conflicts while asserting coverage on new tests.

### Phase 3: Coverage Verification

1. Run full test suite on new structure
2. Run `solidity-coverage` on new tests
3. Compare coverage with `old/` tests to ensure nothing was lost
4. Document any gaps found

### Phase 4: Manual Cleanup

**User manually deletes `old/` folder** after verifying:

- All tests from `old/` are now covered in new structure
- No coverage regression
- All tests pass

## Refactoring Scope

This is a **fresh design**, not a migration:

- Start from a blank slate analyzing what the code should test
- Design comprehensive test coverage based on contract behavior
- Write clear, self-documenting test descriptions
- Add new test cases for gaps in existing coverage
- Reference `old/` for implementation patterns, but don't copy blindly
- Apply consistent fixture usage (loadFixture pattern)
- Iterate on coverage gaps after initial implementation

## Appendix A: Coverage Audit TODOs

_To be populated after running solidity-coverage_

### Template for Gap Documentation

```markdown
### [Contract/Function Name]

- **File**: `contracts/path/to/Contract.sol`
- **Line(s)**: 42-56
- **Branch/Path**: [Description of untested path]
- **Suggested test file**: [Target test file for new test]
- **Priority**: [Critical/High/Medium/Low]
```

## Appendix B: Validation Checklist

### Before Phase 4 (manual cleanup):

- [ ] All new tests pass
- [ ] `old/` folder still exists and untouched
- [ ] Coverage comparison completed between old/ and new structure
- [ ] Each error in `RolesError.sol` has at least one test (colocated with features)
- [ ] Each public/external function has at least one test
- [ ] File names accurately describe contents
- [ ] No "Misc" or catch-all files in new structure
- [ ] TODOs from coverage audit are documented

### After Phase 4 (user manually deletes old/):

- [ ] `old/` folder deleted
- [ ] All tests pass
- [ ] Final coverage report generated
