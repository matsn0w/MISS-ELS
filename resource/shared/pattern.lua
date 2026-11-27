--- Light patterns as a function of time. Pure Lua: no natives, unit tested.
--- Every client passes the synced network time, so all players see the same flash at the same moment.
--- `stagesOn` is the synced list of light stages, e.g. { true, false, true } (see server/state.lua).
Pattern = {}

--- The flash of a pattern that shows at time `now` (ms), or nil for an empty pattern
function Pattern.flashAt(pattern, now)
    local total = 0
    for _, flash in ipairs(pattern) do total = total + flash.duration end

    if total <= 0 then return nil end

    local t = now % total
    for _, flash in ipairs(pattern) do
        if t < flash.duration then return flash end
        t = t - flash.duration
    end
end

--- Which extras and miscs should be lit at time `now`.
--- Stages and the patterns within a stage run concurrently: a light is on when any of them turns it on.
--- @return table<integer, true> extras, table<integer, true> miscs
function Pattern.litLights(vcf, stagesOn, now)
    local extras, miscs = {}, {}

    local function light(flash)
        for _, extra in ipairs(flash.extras) do extras[extra] = true end
        for _, misc in ipairs(flash.miscs) do miscs[misc] = true end
    end

    for number, stage in ipairs(vcf.stages) do
        if stagesOn[number] then
            -- lights that stay on for the whole stage (#107)
            light(stage)

            for _, pattern in ipairs(stage.patterns) do
                local flash = Pattern.flashAt(pattern, now)
                if flash then light(flash) end
            end
        end
    end

    return extras, miscs
end

--- Whether the high beams should be lit at time `now`: nil when no active stage has FlashHighBeam,
--- otherwise 500ms on, 500ms off on the same synced clock as the patterns
function Pattern.highBeamOn(vcf, stagesOn, now)
    for number, stage in ipairs(vcf.stages) do
        if stagesOn[number] and stage.flashHighBeam then
            return now % 1000 < 500
        end
    end

    return nil
end

--- All extras and miscs that any stage of a VCF switches
--- @return table { extras = table<integer, true>, miscs = table<integer, true> }
function Pattern.lightsUsed(vcf)
    local used = { extras = {}, miscs = {} }

    local function add(lights)
        for _, extra in ipairs(lights.extras) do used.extras[extra] = true end
        for _, misc in ipairs(lights.miscs) do used.miscs[misc] = true end
    end

    for _, stage in ipairs(vcf.stages) do
        add(stage)

        for _, pattern in ipairs(stage.patterns) do
            for _, flash in ipairs(pattern) do add(flash) end
        end
    end

    return used
end

--- Whether GTA's own 'emergency mode' should be on: any active stage with IsEmergency
function Pattern.emergencyOn(vcf, stagesOn)
    for number, stage in ipairs(vcf.stages) do
        if stagesOn[number] and stage.isEmergency then return true end
    end

    return false
end

--- Whether any stage is on
function Pattern.anyStageOn(stagesOn)
    for _, on in pairs(stagesOn or {}) do
        if on then return true end
    end

    return false
end
