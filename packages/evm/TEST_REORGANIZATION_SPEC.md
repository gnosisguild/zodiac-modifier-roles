# Test Suite Reorganization Specification

## Goals

**Primary objective**: Maximize coverage visibility - make it easy to verify that all functionality has corresponding tests.

**Coverage depth targets**:
- Every public/external function has at least one test
- Every error condition/revert path is explicitly tested
- Every logical branch in complex functions is exercised
- Edge cases and boundary conditions are tested

## Prerequisites

Before reorganization, run a coverage audit using `solidity-coverage` to:
1. Identify untested code paths
2. Map existing tests to contract coverage
3. Generate TODOs for gaps (see Appendix A)

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

| Domain | Location | Covers |
|--------|----------|--------|
| Role/Member Management | `role-management.spec.ts` | granting/revoking roles, membership validity windows, usage limits, default roles |
| Permission/Clearance Scoping | `scoping.spec.ts` | **Configuration APIs only**: allowTarget, allowFunction, revokeTarget, revokeFunction, clearance level setting. Permission **checking** during execution goes in `transaction-execution.spec.ts` |
| Condition Evaluation | `condition-evaluation.spec.ts` | runtime condition tree evaluation, type matching, parameter constraint checking |
| Allowance Tracking | `allowance-tracking.spec.ts` | consumption, accrual, refill periods, value/call limits, multi-entrypoint allowance |
| Transaction Execution | `transaction-execution.spec.ts` | execTransactionFromModule, execTransactionWithRole, return data variants, reentrancy, bundle handling, ExecutionOptions (send/delegatecall), **permission checking during execution** (target allowed, function allowed, etc.) |
| Serialization | `serialization/` folder | integrity validation, type tree inspection, topology validation, condition packing/unpacking round-trips |
| Owner Access Control | `onlyOwner.spec.ts` | all owner-restricted function tests (self-contained with both success and failure cases) |

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

| Subfolder | Rationale |
|-----------|-----------|
| `operators/` | 20+ files testing individual operators, numbered to match enum |
| `adapters/` | Optional periphery extensions, separate from core |
| `decoder/` | Technical implementation tests, not user-facing behavior |
| `serialization/` | Condition serialization subsystem (integrity, type tree, topology, packing) |

### 6. Error Testing Strategy

Error/revert cases are tested **implicitly within feature tests** - colocated with the functionality they test. Each feature file includes both success and failure scenarios. No dedicated error file.

## Migration Guidelines

### Tests to Redistribute

| Old File | Target Location(s) |
|----------|-------------------|
| `Roles.spec.ts` | Split across: `role-management`, `transaction-execution` |
| `Membership.spec.ts` | `role-management.spec.ts` |
| `Clearance.spec.ts` | `scoping.spec.ts` |
| `Allowance.spec.ts` | `allowance-tracking.spec.ts` (all sections including multiEntrypoint) |
| `AllowanceAccrual.spec.ts` | `allowance-tracking.spec.ts` |
| `ExecutionOptions.spec.ts` | `transaction-execution.spec.ts` |
| `TransactionBundle.spec.ts` | `transaction-execution.spec.ts` |
| `Operator.spec.ts` | Merge into `operators/` (dedupe with existing files) |
| `Integrity.spec.ts` | `serialization/integrity.spec.ts` (keep cohesive) |
| `TypeTree.spec.ts` | `serialization/type-tree.spec.ts` |
| `Topology.spec.ts` | `serialization/topology.spec.ts` |
| `PackerUnpacker.spec.ts` | `serialization/packer-unpacker.spec.ts` |
| `MatchLeadingBytes.spec.ts` | `operators/05Matches.spec.ts` |
| `AbiEncodedLeadingBytes.spec.ts` | `operators/05Matches.spec.ts` |
| `Misc.spec.ts` | Redistribute all tests to appropriate domains (remains in old/) |
| `OnlyOwner.spec.ts` | `onlyOwner.spec.ts` |
| `EmitsEvent.spec.ts` | Colocate event assertions with each feature's tests |
| `Setup.spec.ts` | **Skip** - no deployment testing (remains in old/) |
| `FactoryFriendly.spec.ts` | **Skip** - no deployment testing (remains in old/) |
| `Modifier.spec.ts` | **Skip** - no deployment testing (remains in old/) |
| `decoder/Overflow.spec.ts` | `decoder/overflow.spec.ts` |
| `decoder/Plucking.spec.ts` | `decoder/plucking.spec.ts` |
| `adapters/*` | `adapters/` (rename to kebab-case) |

### Operator Test Integration

1. Keep `operators/` folder with numbered convention
2. Merge `Operator.spec.ts` content into individual operator files
3. Absorb `MatchLeadingBytes.spec.ts` and `AbiEncodedLeadingBytes.spec.ts` into `05Matches.spec.ts`
4. Deduplicate any redundant tests

## Implementation Phases

### Phase 1: Scaffold Placeholder Structure

Create all destination files with placeholder test structure (empty `describe` and `it` blocks):

1. Create new files/folders:
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

2. Each file contains:
   - Import statements
   - `describe` blocks with **descriptive titles** matching the test structure from `old/`
   - **All new `it` blocks use `it.todo()`** with descriptive titles as placeholders
   - For tests merging into **existing files** (e.g., `operators/05Matches.spec.ts`), add new `describe` blocks and `it.todo()` placeholders

   Example placeholder:
   ```typescript
   describe("Membership", () => {
     describe("Validity window", () => {
       it.todo("should reject if membership not yet valid");
       it.todo("should reject if membership expired");
     });
   });
   ```

3. **Commit**: "scaffold: add placeholder test structure"

### Phase 2: Migrate Tests File-by-File

For each source file in `old/`, migrate its tests to the destination file(s):

| Step | Source (old/) | Destination | Commit Message |
|------|---------------|-------------|----------------|
| 2.1 | `Membership.spec.ts` | `role-management.spec.ts` | "migrate: membership tests to role-management" |
| 2.2 | `Roles.spec.ts` (role parts) | `role-management.spec.ts` | "migrate: role tests from Roles.spec" |
| 2.3 | `Roles.spec.ts` (exec parts) | `transaction-execution.spec.ts` | "migrate: execution tests from Roles.spec" |
| 2.4 | `Clearance.spec.ts` | `scoping.spec.ts` | "migrate: clearance tests to scoping" |
| 2.5 | `Allowance.spec.ts` | `allowance-tracking.spec.ts` | "migrate: allowance tests" |
| 2.6 | `AllowanceAccrual.spec.ts` | `allowance-tracking.spec.ts` | "migrate: allowance accrual tests" |
| 2.7 | `ExecutionOptions.spec.ts` | `transaction-execution.spec.ts` | "migrate: execution options tests" |
| 2.8 | `TransactionBundle.spec.ts` | `transaction-execution.spec.ts` | "migrate: transaction bundle tests" |
| 2.9 | `Operator.spec.ts` | `operators/*` | "migrate: operator tests to individual files" |
| 2.10 | `Integrity.spec.ts` | `serialization/integrity.spec.ts` | "migrate: integrity tests" |
| 2.11 | `TypeTree.spec.ts` | `serialization/type-tree.spec.ts` | "migrate: type tree tests" |
| 2.12 | `Topology.spec.ts` | `serialization/topology.spec.ts` | "migrate: topology tests" |
| 2.13 | `PackerUnpacker.spec.ts` | `serialization/packer-unpacker.spec.ts` | "migrate: packer/unpacker tests" |
| 2.14 | `MatchLeadingBytes.spec.ts` | `operators/05Matches.spec.ts` | "migrate: leading bytes tests to Matches operator" |
| 2.15 | `AbiEncodedLeadingBytes.spec.ts` | `operators/05Matches.spec.ts` | "migrate: abi encoded leading bytes tests" |
| 2.16 | `OnlyOwner.spec.ts` | `onlyOwner.spec.ts` | "migrate: onlyOwner tests" |
| 2.17 | `EmitsEvent.spec.ts` | (distribute to features) | "migrate: event tests to feature files" |
| 2.18 | `Misc.spec.ts` | (distribute to domains) | "migrate: misc tests to appropriate domains" |
| 2.19 | `decoder/Overflow.spec.ts` | `decoder/overflow.spec.ts` | "migrate: decoder overflow tests" |
| 2.20 | `decoder/Plucking.spec.ts` | `decoder/plucking.spec.ts` | "migrate: decoder plucking tests" |
| 2.21 | `adapters/MultiSendUnwrapper.spec.ts` | `adapters/multisend-unwrapper.spec.ts` | "migrate: multisend unwrapper tests" |
| 2.22 | `adapters/AvatarIsOwnerOfERC721.spec.ts` | `adapters/avatar-erc721-owner.spec.ts` | "migrate: avatar erc721 owner tests" |

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

This is a **full refactor**, not just a move:
- Consolidate duplicate test cases
- Improve test descriptions for clarity
- Modernize assertion patterns where beneficial
- Apply consistent fixture usage (loadFixture pattern)
- Remove any dead/commented test code

## Appendix A: Coverage Audit TODOs

*To be populated after running solidity-coverage*

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
