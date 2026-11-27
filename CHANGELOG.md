# Changelog

## v3.0.0 (release candidate)

Requires OneSync. See [Upgrading from 2.x to 3.0](docs/upgrading-to-v3.md).

### Resource

- Rewrote the sync: lights, sirens and the horn go through server-checked state bags, so everyone nearby sees and hears the same, including players who arrive later (#111, #84, #99, #36)
- Every player sees the same flash at the same moment (#41)
- Lights no longer stay on after a stage or vehicle is gone (#163, #140)
- Added exports and a synced state for HUDs, AI vehicles and other resources (#166, #28)
- Added up to 10 light stages, several patterns per stage and lights that stay on during a stage (`<STAGES>`, #202, #103, #82, #107); the 2.x `<PATTERN>` format keeps working
- Added a key binding for the flashing high beams, without a default key (#174); the menu switch now applies for everyone (#185)
- Added `InterruptSiren` for the main horn (#179)
- Added `Config.WarningBeepRange`: the warning beep is only heard in the vehicle by default (#173)
- Fixed custom sirens not always loading (#184) and added SirenSharp support (#181)
- Fixed GTA's emergency mode switching off after a short horn press (#30)
- The server console reports mistakes in VCFs (#165)
- Removed nine mode (#175)

## v2.2.1

### Resource

- Fixed the `Couldn't determine your OS!` error on startup (#190)
- Fixed a broken file in `xmlFiles/` crashing the resource; only `.xml` files are loaded (#200)
- Added `Config.VCFFiles` for hosts that block file listing
- Fixed console spam when deleting a vehicle with its lights on (#188)
- Fixed static miscs switching off when the lights reset

## v2.2.0

### Resource

- Added flashing high beams (#89, #118)
- Added stop sign beeping (#101)
- Added personal keybinds (#109)
- Added misc support (#152)
- Improved documentation (#112)
- Replaced NativeUI with WarMenu (#120)

...and some minor changes (#114, #115, #116, #118)

### Configurator

- Added dark mode
- Improved UI/UX
- Updated configurator to match new features

## v2.1.1

### Resource

- Fixed the automatic directory scanner not working on Windows based servers

## v2.1.0

### Resource

- Added automatic scanning for VCF's
- Added 'missing zero' detection in the XML parser
- Fixed a bunch of errors thrown in the console when 'others' activated their lights

### Configurator

- Added importing of existing VCF's
- Fixed missing zeros in XML output

## v2.0.1

### Resource

- Fixed a bug in the update checking script

## v2.0.0

### Resource

- Added configuration option to allow passengers to control the sirens
- Added configuration option to customize indicator controls
- Added configuration option to customize environmental light reflections
- Added new documentation
- Added `/extra <extra>` command to quickly toggle a vehicle extra
- Added an option to control the sirens regardless of the light stage
- Added a in-game menu for static extra's
- Added automatic check for updates
- Added some documentation
- VCF: Added `AllowUse` flag to enable or disable the main horn
- VCF: Added `SoundSet` flag to specify a custom sound for the main horn
- VCF: Added new `STATIC` section
- VCF: `IsElsControlled` is now actually respected
- VCF: It's no longer needed to specify flash numbers within a pattern (Flash01, Flash02, etc. can now be Flash Flash Flash!)
- Fixed `AllowEnvLight` setting not doing anything
- Fixed `AudioString` on MainHorn not doing anything
- Fixed some weird keybind behaviour
- Fixed crash on invalid VCF syntax
- Removed fallback to default patterns when no VCF is present for an ELS-enabled vehicle
- Organized file structure
- Updated SLAXML parser to version 0.8
- Lots of code improvements and optimizations

### Configurator

- Added a VCF configuration GUI

## v1.2.0 - v1.3.0

Original releases from [Infinite Impact Solutions](https://github.com/InfImpSolutions)
