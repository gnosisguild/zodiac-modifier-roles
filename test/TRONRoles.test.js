const TRONRoles = artifacts.require('TRONRoles');
const TestAvatar = artifacts.require('TestAvatar');

contract('TRONRoles', (accounts) => {
  let roles;
  let avatar;
  const owner = accounts[0];
  const module1 = accounts[1];
  const module2 = accounts[2];
  const target1 = accounts[3];
  const target2 = accounts[4];

  beforeEach(async () => {
    // Deploy TestAvatar first
    avatar = await TestAvatar.new();
    
    // Deploy TRON Roles module
    roles = await TRONRoles.new(owner, avatar.address, avatar.address);
  });

  describe('Initialization', () => {
    it('should initialize with correct parameters', async () => {
      assert.equal(await roles.owner(), owner);
      assert.equal(await roles.avatar(), avatar.address);
      assert.equal(await roles.target(), avatar.address);
    });
  });

  describe('Role Management', () => {
    const roleKey1 = web3.utils.keccak256('ADMIN_ROLE');
    const roleKey2 = web3.utils.keccak256('USER_ROLE');

    it('should allow owner to assign roles to modules', async () => {
      const roleKeys = [roleKey1, roleKey2];
      const memberOf = [true, false];

      await roles.assignRoles(module1, roleKeys, memberOf, { from: owner });

      assert.isTrue(await roles.hasRole(module1, roleKey1));
      assert.isFalse(await roles.hasRole(module1, roleKey2));
    });

    it('should reject role assignment with different array lengths', async () => {
      const roleKeys = [roleKey1, roleKey2];
      const memberOf = [true]; // Different length

      try {
        await roles.assignRoles(module1, roleKeys, memberOf, { from: owner });
        assert.fail('Should have reverted');
      } catch (error) {
        assert.include(error.message, 'ArraysDifferentLength');
      }
    });

    it('should allow owner to set default role for module', async () => {
      await roles.setDefaultRole(module1, roleKey1, { from: owner });
      assert.equal(await roles.defaultRoles(module1), roleKey1);
    });
  });

  describe('Target Management', () => {
    const roleKey = web3.utils.keccak256('ADMIN_ROLE');

    it('should allow owner to set target permissions', async () => {
      await roles.setTarget(target1, roleKey, true, { from: owner });
      assert.isTrue(await roles.isTargetAllowed(target1, roleKey));
    });

    it('should allow owner to revoke target permissions', async () => {
      await roles.setTarget(target1, roleKey, true, { from: owner });
      await roles.setTarget(target1, roleKey, false, { from: owner });
      assert.isFalse(await roles.isTargetAllowed(target1, roleKey));
    });
  });

  describe('Module Execution', () => {
    const roleKey = web3.utils.keccak256('ADMIN_ROLE');

    beforeEach(async () => {
      // Set up module with role and target
      await roles.assignRoles(module1, [roleKey], [true], { from: owner });
      await roles.setDefaultRole(module1, roleKey, { from: owner });
      await roles.setTarget(target1, roleKey, true, { from: owner });
    });

    it('should allow authorized module to execute transaction', async () => {
      const data = web3.utils.keccak256('test').slice(0, 10);
      
      const tx = await roles.execTransactionFromModule(
        target1,
        0,
        data,
        0, // Operation.Call
        { from: module1 }
      );

      assert.isTrue(tx.receipt.status);
    });

    it('should reject unauthorized module execution', async () => {
      const data = web3.utils.keccak256('test').slice(0, 10);

      try {
        await roles.execTransactionFromModule(
          target1,
          0,
          data,
          0, // Operation.Call
          { from: module2 } // Unauthorized module
        );
        assert.fail('Should have reverted');
      } catch (error) {
        assert.include(error.message, 'Module not authorized for role');
      }
    });

    it('should reject execution to unauthorized target', async () => {
      const data = web3.utils.keccak256('test').slice(0, 10);

      try {
        await roles.execTransactionFromModule(
          target2, // Unauthorized target
          0,
          data,
          0, // Operation.Call
          { from: module1 }
        );
        assert.fail('Should have reverted');
      } catch (error) {
        assert.include(error.message, 'Target not allowed for role');
      }
    });
  });

  describe('Role-based Execution', () => {
    const roleKey1 = web3.utils.keccak256('ADMIN_ROLE');
    const roleKey2 = web3.utils.keccak256('USER_ROLE');

    beforeEach(async () => {
      // Set up module with multiple roles
      await roles.assignRoles(module1, [roleKey1, roleKey2], [true, true], { from: owner });
      await roles.setTarget(target1, roleKey1, true, { from: owner });
      await roles.setTarget(target2, roleKey2, true, { from: owner });
    });

    it('should allow execution with specific role', async () => {
      const data = web3.utils.keccak256('test').slice(0, 10);

      const tx = await roles.execTransactionWithRole(
        target1,
        0,
        data,
        0, // Operation.Call
        roleKey1,
        { from: module1 }
      );

      assert.isTrue(tx.receipt.status);
    });

    it('should reject execution with wrong role', async () => {
      const data = web3.utils.keccak256('test').slice(0, 10);

      try {
        await roles.execTransactionWithRole(
          target1, // Only allowed for roleKey1
          0,
          data,
          0, // Operation.Call
          roleKey2, // Wrong role
          { from: module1 }
        );
        assert.fail('Should have reverted');
      } catch (error) {
        assert.include(error.message, 'Target not allowed for role');
      }
    });
  });
});
