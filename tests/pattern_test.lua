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

local function stage(patterns, extras, miscs)
    return { patterns = patterns, extras = extras or {}, miscs = miscs or {} }
end

Test('litLights combines all active stages and their patterns', function()
    local vcf = {
        stages = {
            stage({ pattern({ 100, { 1, 2 }, { 0 } }, { 100, { 3 } }) }),
            stage({ pattern({ 200, { 3, 5 } }), pattern({ 50, { 8 } }, { 50, {} }) }),
            stage({ pattern({ 200, { 7 } }) }, { 11 }, { 4 }),
        },
    }

    local extras, miscs = Pattern.litLights(vcf, { true }, 0)
    Eq(keys(extras), '1,2', 'stage 1 only, first flash')
    Eq(keys(miscs), '0', 'misc')

    extras = Pattern.litLights(vcf, { true, true }, 150)
    Eq(keys(extras), '3,5', 'stage 1 second flash + stage 2, second pattern between flashes')

    extras = Pattern.litLights(vcf, { false, true }, 20)
    Eq(keys(extras), '3,5,8', 'both patterns of stage 2 at once (#103)')

    extras, miscs = Pattern.litLights(vcf, { [3] = true }, 0)
    Eq(keys(extras), '7,11', 'stage 3 pattern + its steady extra (#107)')
    Eq(keys(miscs), '4', 'steady misc')

    extras = Pattern.litLights(vcf, {}, 0)
    Eq(keys(extras), '', 'nothing on')
end)

Test('lightsUsed lists every light any stage switches', function()
    local vcf = Vcf.parse(ReadFile('resource/xmlFiles/Example.xml'))
    local used = Pattern.lightsUsed(vcf)

    Eq(keys(used.extras), '1,2,3,4,5,6,7,9', 'extras')
    Eq(keys(used.miscs), table.concat({ ConvertMiscNameToId('a'), ConvertMiscNameToId('b'), ConvertMiscNameToId('j'), ConvertMiscNameToId('k') }, ','), 'miscs')
end)

Test('highBeamOn flashes only while a stage with FlashHighBeam is active', function()
    local vcf = Vcf.parse(ReadFile('resource/xmlFiles/Example.xml'))

    -- Example.xml: PRIMARY (stage 1) has FlashHighBeam="true", the others don't
    Eq(Pattern.highBeamOn(vcf, { true }, 100), true, 'first half second')
    Eq(Pattern.highBeamOn(vcf, { true }, 600), false, 'second half second')
    Eq(Pattern.highBeamOn(vcf, { true }, 1100), true, 'next cycle')
    Eq(Pattern.highBeamOn(vcf, { false, true, true }, 100), nil, 'stages without high beams')
    Eq(Pattern.highBeamOn(vcf, {}, 100), nil, 'nothing on')
end)

Test('anyStageOn', function()
    Eq(Pattern.anyStageOn({ false, false }), false, 'all off')
    Eq(Pattern.anyStageOn({ false, true }), true, 'one on')
    Eq(Pattern.anyStageOn(nil), false, 'no state')
end)

Test('emergencyOn: only while a stage with IsEmergency is on (#30)', function()
    -- Example.xml: stage 1 is an emergency stage, stage 2 has IsEmergency="false"
    local vcf = Vcf.parse(ReadFile('resource/xmlFiles/Example.xml'))

    Eq(Pattern.emergencyOn(vcf, { true }), true, 'stage 1')
    Eq(Pattern.emergencyOn(vcf, { false, true }), false, 'stage 2 only')
    Eq(Pattern.emergencyOn(vcf, {}), false, 'nothing on')
end)
