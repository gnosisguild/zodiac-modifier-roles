// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.0;

import "@gnosis.pm/zodiac/contracts/core/Modifier.sol";

contract Roles is Modifier {
  event SetTargetAllowed(uint16 role, address target, bool allowed);
  event SetTargetScoped(uint16 role, address target, bool scoped);
  event SetSendAllowedOnTarget(uint16 role, address target, bool allowed);
  event SetDelegateCallAllowedOnTarget(
    uint16 role,
    address target,
    bool allowed
  );
  event SetFunctionAllowedOnTarget(
    uint16 role,
    address target,
    bytes4 functionSig,
    bool allowed
  );
  event AssignRole(address module, uint16 role);
  event RolesSetup(
    address indexed initiator,
    address indexed owner,
    address indexed avatar,
    address target
  );

  struct Target {
    bool allowed;
    bool scoped;
    bool delegateCallAllowed;
    bool sendAllowed;
    mapping(bytes4 => bool) allowedFunctions;
  }

  mapping(uint16 => mapping(address => Target)) internal allowedTargetsForRole;

  mapping(address => mapping(uint16 => uint16)) internal assignedRoles;

  /// @param _owner Address of the owner
  /// @param _avatar Address of the avatar (e.g. a Gnosis Safe)
  /// @param _target Address of the contract that will call exec function
  constructor(
    address _owner,
    address _avatar,
    address _target
  ) {
    bytes memory initParams = abi.encode(_owner, _avatar, _target);
    setUp(initParams);
  }

  function setUp(bytes memory initParams) public override {
    (address _owner, address _avatar, address _target) =
      abi.decode(initParams, (address, address, address));
    __Ownable_init();
    require(_avatar != address(0), "Avatar can not be zero address");
    require(_target != address(0), "Target can not be zero address");

    avatar = _avatar;
    target = _target;

    transferOwnership(_owner);
    setupModules();

    emit RolesSetup(msg.sender, _owner, _avatar, _target);
  }

  function setupModules() internal {
    require(
      modules[SENTINEL_MODULES] == address(0),
      "setUpModules has already been called"
    );
    modules[SENTINEL_MODULES] = SENTINEL_MODULES;
  }

  /// @dev Set whether or not calls can be made to an address.
  /// @notice Only callable by owner.
  /// @param role Role to set for
  /// @param target Address to be allowed/disallowed.
  /// @param allow Bool to allow (true) or disallow (false) calls to target.
  function setTargetAllowed(
    uint16 role,
    address target,
    bool allow
  ) public onlyOwner {
    allowedTargetsForRole[role][target].allowed = allow;
    emit SetTargetAllowed(
      role,
      target,
      allowedTargetsForRole[role][target].allowed
    );
  }

  /// @dev Set whether or not delegate calls can be made to a target.
  /// @notice Only callable by owner.
  /// @param role Role to set for
  /// @param target Address to which delegate calls should be allowed/disallowed.
  /// @param allow Bool to allow (true) or disallow (false) delegate calls to target.
  function setDelegateCallAllowedOnTarget(
    uint16 role,
    address target,
    bool allow
  ) public onlyOwner {
    allowedTargetsForRole[role][target].delegateCallAllowed = allow;
    emit SetDelegateCallAllowedOnTarget(
      role,
      target,
      allowedTargetsForRole[role][target].delegateCallAllowed
    );
  }

  /// @dev Sets whether or not calls to an address should be scoped to specific function signatures.
  /// @notice Only callable by owner.
  /// @param role Role to set for
  /// @param target Address to be scoped/unscoped.
  /// @param scoped Bool to scope (true) or unscope (false) function calls on target.
  function setScoped(
    uint16 role,
    address target,
    bool scoped
  ) public onlyOwner {
    allowedTargetsForRole[role][target].scoped = scoped;
    emit SetTargetScoped(
      role,
      target,
      allowedTargetsForRole[role][target].scoped
    );
  }

  /// @dev Sets whether or not a target can be sent to (incluces fallback/receive functions).
  /// @notice Only callable by owner.
  /// @param role Role to set for
  /// @param target Address to be allow/disallow sends to.
  /// @param allow Bool to allow (true) or disallow (false) sends on target.
  function setSendAllowedOnTarget(
    uint16 role,
    address target,
    bool allow
  ) public onlyOwner {
    allowedTargetsForRole[role][target].sendAllowed = allow;
    emit SetSendAllowedOnTarget(
      role,
      target,
      allowedTargetsForRole[role][target].sendAllowed
    );
  }

  /// @dev Sets whether or not a specific function signature should be allowed on a scoped target.
  /// @notice Only callable by owner.
  /// @param role Role to set for
  /// @param target Scoped address on which a function signature should be allowed/disallowed.
  /// @param functionSig Function signature to be allowed/disallowed.
  /// @param allow Bool to allow (true) or disallow (false) calls a function signature on target.
  function setAllowedFunction(
    uint16 role,
    address target,
    bytes4 functionSig,
    bool allow
  ) public onlyOwner {
    allowedTargetsForRole[role][target].allowedFunctions[functionSig] = allow;
    emit SetFunctionAllowedOnTarget(
      role,
      target,
      functionSig,
      allowedTargetsForRole[role][target].allowedFunctions[functionSig]
    );
  }

  function assignRole(address module, uint16 role) public onlyOwner {
    require(role > 0, "invalid role");
    assignedRoles[module][role] = assignedRoles[module][0];
    assignedRoles[module][0] = role;
    emit AssignRole(module, role);
  }

  /// @dev Returns bool to indicate if an address is an allowed target.
  /// @param role Role to check for.
  /// @param target Address to check.
  function isAllowedTarget(uint16 role, address target)
    public
    view
    returns (bool)
  {
    return (allowedTargetsForRole[role][target].allowed);
  }

  /// @dev Returns bool to indicate if an address is scoped.
  /// @param role Role to check for.
  /// @param target Address to check.
  function isScoped(uint16 role, address target) public view returns (bool) {
    return (allowedTargetsForRole[role][target].scoped);
  }

  /// @dev Returns bool to indicate if an address is scoped.
  /// @param role Role to check for.
  /// @param target Address to check.
  function isSendAllowed(uint16 role, address target)
    public
    view
    returns (bool)
  {
    return (allowedTargetsForRole[role][target].sendAllowed);
  }

  /// @dev Returns bool to indicate if a function signature is allowed for a target address.
  /// @param role Role to check for.
  /// @param target Address to check.
  /// @param functionSig Signature to check.
  function isAllowedFunction(
    uint16 role,
    address target,
    bytes4 functionSig
  ) public view returns (bool) {
    return (allowedTargetsForRole[role][target].allowedFunctions[functionSig]);
  }

  /// @dev Returns bool to indicate if delegate calls are allowed to a target address.
  /// @param role Role to check for.
  /// @param target Address to check.
  function isAllowedToDelegateCall(uint16 role, address target)
    public
    view
    returns (bool)
  {
    return (allowedTargetsForRole[role][target].delegateCallAllowed);
  }

  function isAllowedTransaction(
    uint16 role,
    address to,
    bytes memory data,
    Enum.Operation operation
  ) public view returns (bool) {
    if (
      operation == Enum.Operation.DelegateCall &&
      !allowedTargetsForRole[role][to].delegateCallAllowed
    ) {
      return false;
    }

    if (!allowedTargetsForRole[role][to].allowed) {
      return false;
    }
    if (data.length >= 4) {
      if (
        allowedTargetsForRole[role][to].scoped &&
        !allowedTargetsForRole[role][to].allowedFunctions[bytes4(data)]
      ) {
        return false;
      }
    } else {
      if (
        allowedTargetsForRole[role][to].scoped &&
        !allowedTargetsForRole[role][to].sendAllowed
      ) {
        return false;
      }
    }

    return true;
  }

  function checkTransaction(
    address to,
    bytes memory data,
    Enum.Operation operation
  ) internal view {
    require(
      data.length == 0 || data.length >= 4,
      "Function signature too short"
    );

    uint16 role = assignedRoles[msg.sender][0];
    while (role > 0) {
      if (isAllowedTransaction(role, to, data, operation)) return;
    }

    revert("Call is not allowed for any assigned role");
  }

  /// @dev Passes a transaction to the modifier.
  /// @param to Destination address of module transaction
  /// @param value Ether value of module transaction
  /// @param data Data payload of module transaction
  /// @param operation Operation type of module transaction
  /// @notice Can only be called by enabled modules
  function execTransactionFromModule(
    address to,
    uint256 value,
    bytes calldata data,
    Enum.Operation operation
  ) public override moduleOnly returns (bool success) {
    checkTransaction(to, data, operation);
    return exec(to, value, data, operation);
  }

  /// @dev Passes a transaction to the modifier, expects return data.
  /// @param to Destination address of module transaction
  /// @param value Ether value of module transaction
  /// @param data Data payload of module transaction
  /// @param operation Operation type of module transaction
  /// @notice Can only be called by enabled modules
  function execTransactionFromModuleReturnData(
    address to,
    uint256 value,
    bytes calldata data,
    Enum.Operation operation
  ) public override moduleOnly returns (bool success, bytes memory returnData) {
    checkTransaction(to, data, operation);
    return execAndReturnData(to, value, data, operation);
  }
}
