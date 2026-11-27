# Upgrading from 2.x to 3.0

Version 3 is a rewrite of how MISS-ELS syncs lights and sirens. For most servers, upgrading is the [usual update](installation.md#upgrading): your `config.lua`, VCFs and players' key bindings keep working.

## Before you upgrade

- **OneSync is required.** It is on by default for servers started with txAdmin. Otherwise add `set onesync on` to your server's start command or `server.cfg`.
- baseevents and WarMenu are still required, as in 2.x.

## What you need to change

Nothing. Everything below is optional.

## What's new

**For players**

- Lights, sirens and the horn are synced for everyone nearby: every player sees the same flash at the same moment, including players who arrive later or sit in someone else's vehicle.
- Q, K and L work as before. VCFs can now have up to 10 light stages; players bind stages 4 to 10 themselves (*Settings → Key Bindings → FiveM*).
- The flashing high beam switch in the vehicle menu (U) now applies for everyone, not just the driver.
- The warning beep is only heard inside the vehicle by default.

**`config.lua`** (copy from `config.example.lua` if you want them)

- `Config.WarningBeepRange`: let people outside the vehicle hear the warning beep, fading out over this many meters. Default `0.0`: only inside.
- `Config.VCFFiles`: list your VCFs by name, for hosts that don't allow resources to list files. Not needed otherwise.

**VCFs** (see [the VCF reference](vcf.md))

- `<STAGES>`: up to 10 light stages, several patterns per stage running at the same time, and lights that stay on while a stage is active. The 2.x `<PATTERN>` format keeps working; there is no need to convert.
- `<MainHorn InterruptSiren="true" />`: the horn silences the siren while it sounds.
- The server console now reports mistakes in VCFs, such as unknown elements or lights that a pattern uses but `EOVERRIDE` doesn't declare.

## What was removed

- **Nine mode**: the "999 mode activated" sound. `<NineMode>` in a VCF is ignored.

## For developers of other resources

If another resource used MISS-ELS' internal events, it needs to switch to the [API](api.md): the synced `els` state bag and the exports. These 2.x events were removed:

- `kjELS:setSirenState`, `kjELS:updateSiren`
- `kjELS:toggleHorn`, `kjELS:updateHorn`
- `kjELS:toggleLights`
