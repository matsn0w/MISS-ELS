# API for other resources

MISS-ELS keeps the state of every ELS vehicle in a replicated [state bag](https://docs.fivem.net/docs/scripting-manual/networking/state-bags/) called `els`. Only MISS-ELS writes it, but any resource can read it. MISS-ELS requires OneSync.

```lua
{
    stages = { false, true, false }, -- light stages 1 to 10, as many as the VCF has
    siren = 0,          -- 0 = off, 1-4 = siren tone
    horn = false,
    highBeam = true,    -- flashing high beams switched on in the vehicle menu
}
```

## Reacting to changes (HUDs, GUIs)

```lua
AddStateBagChangeHandler('els', nil, function(bagName, _, state)
    local vehicle = GetEntityFromStateBagName(bagName)
    if vehicle == 0 then return end

    print(('stage 1 %s, siren %d'):format(tostring(state.stages[1]), state.siren))
end)
```

## Client exports

```lua
local state = exports['MISS-ELS']:GetVehicleState(vehicle)

-- goes through the same checks as a key press: the player must drive the vehicle
-- (or be an allowed passenger), and the VCF must allow the siren tone
exports['MISS-ELS']:RequestVehicleState(vehicle, { stages = { [1] = 'toggle' } })
exports['MISS-ELS']:RequestVehicleState(vehicle, { siren = 2 })
```

## Server exports

For vehicles without a player, such as AI vehicles. Skips the driver check; the VCF rules still apply.

```lua
exports['MISS-ELS']:SetVehicleState(vehicle, { stages = { [1] = true }, siren = 1 }) -- returns false without a VCF
local state = exports['MISS-ELS']:GetVehicleState(vehicle)
```

Every field accepts `true`/`false` (or a tone number for `siren`). Stages are changed by number, e.g. `{ stages = { [2] = true } }`, and the stages and `highBeam` also accept `'toggle'`.
