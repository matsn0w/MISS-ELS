--- Rules for a vehicle's ELS state (the 'els' state bag). Pure Lua: no natives, unit tested.
ElsState = {}

--- a requested boolean, or the opposite of the current value for 'toggle' (so quick key presses never act on stale state)
local function wanted(value, current)
    if value == 'toggle' then return not current end
    if type(value) == 'boolean' then return value end
end

function ElsState.default()
    return { stages = {}, siren = 0, horn = false, highBeam = true }
end

--- Apply a client's requested changes to the current state. Anything invalid is ignored.
--- @param current table|nil the vehicle's current state
--- @param changes table requested fields, e.g. { stages = { [1] = 'toggle' } }, { siren = 2 } or { highBeam = false }
--- @param vcf table the parsed VCF of the vehicle
--- @param sirenAlwaysAllowed boolean Config.SirenAlwaysAllowed
--- @return table state the new state
function ElsState.apply(current, changes, vcf, sirenAlwaysAllowed)
    local state = ElsState.default()
    current = type(current) == 'table' and current or {}

    -- one boolean per stage of this vehicle, so the state bag stays a plain list
    for number = 1, #vcf.stages do
        state.stages[number] = type(current.stages) == 'table' and current.stages[number] == true
    end
    for _, key in ipairs({ 'siren', 'horn', 'highBeam' }) do
        if current[key] ~= nil then state[key] = current[key] end
    end

    if type(changes) ~= 'table' then return state end

    local stageChanged = false
    if type(changes.stages) == 'table' then
        for number, value in pairs(changes.stages) do
            -- only stages this vehicle has
            if state.stages[number] ~= nil then value = wanted(value, state.stages[number]) else value = nil end

            if value ~= nil and value ~= state.stages[number] then
                state.stages[number] = value
                stageChanged = true
            end
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

        -- the siren needs stage 1 (the primary lights), unless the server allows it without
        if tone and tone.allowUse and (state.stages[1] or sirenAlwaysAllowed) then
            state.siren = siren
        end
    end

    -- turning the last light stage off also stops the siren
    if stageChanged then
        local anyOn = false
        for _, on in ipairs(state.stages) do anyOn = anyOn or on end

        if not anyOn then state.siren = 0 end
    end

    return state
end
