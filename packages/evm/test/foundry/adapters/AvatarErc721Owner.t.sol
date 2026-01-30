// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "forge-std/Test.sol";

import {Roles} from "../../../contracts/Roles.sol";
import {TestAvatar} from "../../../contracts/__test__/fixtures/TestAvatar.sol";
import {MockERC721} from "../../../contracts/__test__/mocks/MockERC721.sol";
import {AvatarIsOwnerOfERC721} from "../../../contracts/periphery/AvatarIsOwnerOfERC721.sol";
import {ConditionFlat, Encoding} from "../../../contracts/types/Condition.sol";
import {Operator} from "../../../contracts/types/Operator.sol";
import {ExecutionOptions} from "../../../contracts/types/Permission.sol";
import {IRolesError} from "../../../contracts/types/RolesError.sol";
import {Operation} from "@gnosis-guild/zodiac-core/contracts/core/Operation.sol";

/// @dev Minimal singleton factory for ImmutableStorage. Deploys initCode via CREATE2.
contract MockSingletonFactory {
    function deploy(bytes memory initCode, bytes32 salt) external returns (address) {
        address addr;
        assembly {
            addr := create2(0, add(initCode, 0x20), mload(initCode), salt)
        }
        return addr;
    }
}

/// @title AvatarIsOwnerOfERC721 Tests
/// @notice Verifies the custom condition checker that validates the avatar
///         owns a specific ERC721 token.
contract AvatarErc721OwnerTest is Test {
    Roles internal roles;
    TestAvatar internal avatar;
    MockERC721 internal nft;
    AvatarIsOwnerOfERC721 internal checker;

    address internal owner;
    address internal member;
    bytes32 internal roleKey;

    address internal constant SINGLETON_FACTORY = 0xce0042B868300000d44A59004Da54A005ffdcf9f;

    function setUp() public {
        // Deploy singleton factory for ImmutableStorage
        {
            MockSingletonFactory factory = new MockSingletonFactory();
            vm.etch(SINGLETON_FACTORY, address(factory).code);
        }

        owner = makeAddr("owner");
        member = makeAddr("member");
        roleKey = keccak256("TEST_ROLE");

        vm.startPrank(owner);

        avatar = new TestAvatar();
        roles = new Roles(owner, address(avatar), address(avatar));

        nft = new MockERC721();
        checker = new AvatarIsOwnerOfERC721();

        // Enable module and grant role
        roles.enableModule(member);
        roles.grantRole(member, roleKey, 0, 0, 0);
        roles.setDefaultRole(member, roleKey);

        // Set up a Custom condition on the doSomething(uint256,uint256) function
        // pointing to the checker contract.
        bytes4 selector = MockERC721.doSomething.selector;

        ConditionFlat[] memory conditions = new ConditionFlat[](3);
        conditions[0] = ConditionFlat({
            parent: 0,
            paramType: Encoding.AbiEncoded,
            operator: Operator.Matches,
            compValue: ""
        });
        // First param: Custom checker on tokenId
        conditions[1] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.Custom,
            compValue: abi.encodePacked(address(checker))
        });
        // Second param: Pass
        conditions[2] = ConditionFlat({
            parent: 0,
            paramType: Encoding.Static,
            operator: Operator.Pass,
            compValue: ""
        });

        roles.scopeTarget(roleKey, address(nft));
        bytes memory packed = roles.packConditions(conditions);
        roles.allowFunction(roleKey, address(nft), selector, packed, ExecutionOptions.None);

        vm.stopPrank();
    }

    function test_passesWhenAvatarOwnsToken() public {
        uint256 tokenId = 42;
        // Mint token to avatar
        nft.mint(address(avatar), tokenId);

        // Execute: doSomething(42, 999) - should pass because avatar owns token 42
        vm.prank(member);
        roles.execTransactionFromModule(
            payable(address(nft)),
            0,
            abi.encodeCall(MockERC721.doSomething, (tokenId, 999)),
            Operation.Call
        );
    }

    function test_failsWhenAvatarDoesNotOwnToken() public {
        uint256 tokenId = 42;
        address someone = makeAddr("someone");
        // Mint token to someone else
        nft.mint(someone, tokenId);

        // Execute: doSomething(42, 999) - should fail because avatar does not own token 42
        vm.prank(member);
        vm.expectRevert();
        roles.execTransactionFromModule(
            payable(address(nft)),
            0,
            abi.encodeCall(MockERC721.doSomething, (tokenId, 999)),
            Operation.Call
        );
    }
}
