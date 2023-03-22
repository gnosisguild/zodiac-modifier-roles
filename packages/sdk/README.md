# Zodiac Roles SDK

This package offers an SDK for managing role permissions, based on presets.

## Permission presets

A preset is a permissions template tailored to a specific use case and chain.
When a preset is applied to a certain instance of a Roles modifier, the associated Avatar address is filled into preset for the respective placeholder values.
The resulting permissions are compared and diffed to the current permissions stored on the Roles modifier contract for that role.
Based on that, it calculates a set of permission update calls to patch the role configuration to the new desired target state.
These calls can finally be executed to apply the role permissions update.
