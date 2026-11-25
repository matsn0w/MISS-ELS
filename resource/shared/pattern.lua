--- Light patterns as a function of time. Pure Lua: no natives, unit tested.
--- Every client passes the synced network time, so all players see the same flash at the same moment.
Pattern = {}

--- Light stages in key order, and the VCF pattern that drives each (2.x names, kept for VCF compatibility)
Pattern.STAGES = { 'primary', 'secondary', 'warning' }
Pattern.VCF_PATTERN = { primary = 'primary', secondary = 'rearreds', warning = 'secondary' }

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

--- Which extras and miscs should be lit for a vehicle's state at time `now`.
--- Stages run concurrently: a light is on when any active stage turns it on.
--- @return table<integer, true> extras, table<integer, true> miscs
function Pattern.litLights(vcf, state, now)
    local extras, miscs = {}, {}

    for _, stage in ipairs(Pattern.STAGES) do
        local flash = state[stage] and Pattern.flashAt(vcf.patterns[Pattern.VCF_PATTERN[stage]], now)

        if flash then
            for _, extra in ipairs(flash.extras) do extras[extra] = true end
            for _, misc in ipairs(flash.miscs) do miscs[misc] = true end
        end
    end

    return extras, miscs
end
