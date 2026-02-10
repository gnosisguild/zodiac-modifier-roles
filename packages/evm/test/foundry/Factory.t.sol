// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.30;

import "forge-std/Test.sol";

import "../../contracts/Roles.sol";
import "../../contracts/__test__/fixtures/TestAvatar.sol";
import "../../contracts/__test__/fixtures/TestFactory.sol";

/// @title Factory Tests
/// @notice Verifies Roles module works with ModuleProxyFactory and
///         cannot be re-initialized after deployment.
contract FactoryTest is Test {
    address internal owner;

    function setUp() public {
        owner = makeAddr("owner");
    }

    function test_masterCopyAlreadyInitialized() public {
        TestAvatar avatar = new TestAvatar();

        vm.prank(owner);
        Roles masterCopy = new Roles(owner, address(avatar), address(avatar));

        // Try to setUp again - should revert
        bytes memory initParams = abi.encode(owner, address(avatar), address(avatar));
        vm.expectRevert("Initializable: contract is already initialized");
        masterCopy.setUp(initParams);
    }

    function test_deployNewProxy() public {
        TestAvatar avatar = new TestAvatar();

        // Deploy master copy with a throwaway owner
        Roles masterCopy = new Roles(address(1), address(1), address(1));

        ModuleProxyFactory factory = new ModuleProxyFactory();

        bytes memory initParams = abi.encode(owner, address(avatar), address(avatar));
        bytes memory initializer = abi.encodeWithSignature("setUp(bytes)", initParams);

        address proxy = factory.deployModule(
            address(masterCopy),
            initializer,
            0 // saltNonce
        );

        Roles proxyRoles = Roles(proxy);
        assertEq(proxyRoles.avatar(), address(avatar));
        assertEq(proxyRoles.owner(), owner);
    }
}
