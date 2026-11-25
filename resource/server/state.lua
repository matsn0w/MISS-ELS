--- Rules for a vehicle's ELS state (the 'els' state bag). Pure Lua: no natives, unit tested.
ElsState = {}

local STAGES = { 'primary', 'secondary', 'warning' }

function ElsState.default()
    return { primary = false, secondary = false, warning = false, siren = 0, horn = false }
end

--- Apply a client's requested changes to the current state. Anything invalid is ignored.
--- @param current table|nil the vehicle's current state
--- @param changes table requested fields, e.g. { primary = true } or { siren = 2 }
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
        if type(changes[stage]) == 'boolean' and changes[stage] ~= state[stage] then
            state[stage] = changes[stage]
            stageChanged = true
        end
    end

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
