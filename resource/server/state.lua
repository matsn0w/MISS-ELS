--- Rules for a vehicle's ELS state (the 'els' state bag). Pure Lua: no natives, unit tested.
ElsState = {}

local STAGES = { 'primary', 'secondary', 'warning' }

--- a requested boolean, or the opposite of the current value for 'toggle' (so quick key presses never act on stale state)
local function wanted(value, current)
    if value == 'toggle' then return not current end
    if type(value) == 'boolean' then return value end
end

function ElsState.default()
    return { primary = false, secondary = false, warning = false, siren = 0, horn = false, highBeam = true }
end

--- Apply a client's requested changes to the current state. Anything invalid is ignored.
--- @param current table|nil the vehicle's current state
--- @param changes table requested fields, e.g. { primary = true }, { siren = 2 } or { primary = 'toggle' }
--- @param vcf table the parsed VCF of the vehicle
--- @param sirenAlwaysAllowed boolean Config.SirenAlwaysAllowed
--- @return table state the new state
function ElsState.apply(current, changes, vcf, sirenAlwaysAllowed)
    local state = ElsState.default()
    for key in pairs(state) do
        if current and current[key] ~= nil then state[key] = current[key] end
    end

    if type(changes) ~= 'table' then return state end

    local stageChanged = false
    for _, stage in ipairs(STAGES) do
        local value = wanted(changes[stage], state[stage])
        if value ~= nil and value ~= state[stage] then
            state[stage] = value
            stageChanged = true
        end
    end

    local highBeam = wanted(changes.highBeam, state.highBeam)
    if highBeam ~= nil then state.highBeam = highBeam end

    if type(changes.horn) == 'boolean' then
        local horn = vcf.sounds.mainHorn
        state.horn = changes.horn and horn ~= nil and horn.allowUse
    end

    local siren = changes.siren
    if siren == 0 then
        state.siren = 0
    elseif type(siren) == 'number' and siren >= 1 and siren <= 4 and siren % 1 == 0 then
        local tone = vcf.sounds['srnTone' .. siren]

        -- the siren needs the primary lights, unless the server allows it without
        if tone and tone.allowUse and (state.primary or sirenAlwaysAllowed) then
            state.siren = siren
        end
    end

    -- turning the last light stage off also stops the siren
    if stageChanged and not (state.primary or state.secondary or state.warning) then
        state.siren = 0
    end

    return state
end
