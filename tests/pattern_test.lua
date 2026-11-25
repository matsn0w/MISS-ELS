local function pattern(...)
    local flashes = {}
    for i, spec in ipairs({ ... }) do
        flashes[i] = { duration = spec[1], extras = spec[2] or {}, miscs = spec[3] or {} }
    end
    return flashes
end

local function keys(set)
    local list = {}
    for key in pairs(set) do list[#list + 1] = key end
    table.sort(list)
    return table.concat(list, ',')
end

Test('flashAt picks the flash for the time within the cycle', function()
    local p = pattern({ 100, { 1 } }, { 50, { 2 } }, { 150, {} })

    Eq(Pattern.flashAt(p, 0), p[1], 'start')
    Eq(Pattern.flashAt(p, 99), p[1], 'end of first flash')
    Eq(Pattern.flashAt(p, 100), p[2], 'second flash starts')
    Eq(Pattern.flashAt(p, 299), p[3], 'last ms of the cycle')
    Eq(Pattern.flashAt(p, 300), p[1], 'cycle repeats')
    Eq(Pattern.flashAt(p, 300 * 1000 + 120), p[2], 'large network times')
end)

Test('flashAt handles empty patterns', function()
    Eq(Pattern.flashAt({}, 1234), nil, 'no flashes')
    Eq(Pattern.flashAt(pattern({ 0 }), 1234), nil, 'zero duration')
end)

Test('litLights combines all active stages', function()
    local vcf = {
        patterns = {
            primary = pattern({ 100, { 1, 2 }, { 0 } }, { 100, { 3 } }),
            rearreds = pattern({ 200, { 3, 5 } }),
            secondary = pattern({ 200, { 7 } }),
        },
    }

    local extras, miscs = Pattern.litLights(vcf, { primary = true }, 0)
    Eq(keys(extras), '1,2', 'primary only, first flash')
    Eq(keys(miscs), '0', 'misc')

    extras = Pattern.litLights(vcf, { primary = true, secondary = true }, 150)
    Eq(keys(extras), '3,5', 'primary second flash + secondary stage (rearreds pattern)')

    extras = Pattern.litLights(vcf, { warning = true }, 0)
    Eq(keys(extras), '7', 'warning stage uses the secondary pattern')

    extras = Pattern.litLights(vcf, {}, 0)
    Eq(keys(extras), '', 'nothing on')
end)
