local function vcfXml(body)
    return '<?xml version="1.0"?><vcfroot>' .. body .. '</vcfroot>'
end

for _, file in ipairs({ 'Example.xml', 'Example_ServerSideSIrens.xml' }) do
    Test('shipped ' .. file .. ' parses without problems', function()
        local vcf, problems = Vcf.parse(ReadFile('resource/xmlFiles/' .. file))

        assert(vcf, 'expected a parsed VCF')
        Eq(#problems, 0, table.concat(problems, '; '))
    end)
end

Test('Example.xml is parsed into the shape the client expects', function()
    local vcf = Vcf.parse(ReadFile('resource/xmlFiles/Example.xml'))
    local A, B, K = ConvertMiscNameToId('a'), ConvertMiscNameToId('b'), ConvertMiscNameToId('k')

    Eq(vcf.extras[1].env_light, true, 'Extra01 env light')
    Eq(vcf.extras[1].env_color, 'BLUE', 'Extra01 color')
    Eq(vcf.extras[9].env_pos.x, 0.40, 'Extra09 offset x')
    Eq(vcf.extras[9].env_pos.y, -0.80, 'Extra09 offset y')
    Eq(vcf.extras[11].env_light, false, 'Extra11 env light')
    Eq(vcf.extras[12].enabled, true, 'Extra12 enabled by default')
    Eq(vcf.miscs[A].env_color, 'AMBER', 'MiscA color')
    Eq(vcf.miscs[K].env_light, false, 'MiscK env light')

    Eq(vcf.statics.extras[11].name, 'Bullbar', 'static Extra11')
    Eq(vcf.statics.miscs[K].name, 'Cup of coffee', 'static MiscK')

    Eq(vcf.sounds.mainHorn.allowUse, false, 'horn AllowUse defaults to false')
    Eq(vcf.sounds.mainHorn.audioString, 'SIRENS_AIRHORN', 'horn audio')
    Eq(vcf.sounds.nineMode, nil, 'nine mode is removed (#175)')
    Eq(vcf.sounds.srnTone1.audioString, 'VEHICLES_HORNS_SIREN_1', 'tone 1')
    Eq(vcf.sounds.srnTone4.allowUse, true, 'tone 4 allowed')

    -- backwards compatible: the 2.x <PATTERN> format becomes stages 1-3 on the same keys
    Eq(#vcf.stages, 3, 'three stages')
    local primary = vcf.stages[1].patterns[1]
    Eq(vcf.stages[1].name, 'Primary', 'stage 1 name')
    Eq(vcf.stages[1].flashHighBeam, true, 'primary flashes high beam')
    Eq(vcf.stages[1].isEmergency, true, 'primary is emergency by default')
    Eq(#vcf.stages[1].patterns, 1, 'one pattern per old stage')
    Eq(primary[1].duration, 80, 'first flash duration')
    Eq(table.concat(primary[1].extras, ','), '1,2', 'first flash extras')
    Eq(table.concat(primary[1].miscs, ','), A .. ',' .. B, 'first flash miscs')
end)

Test('extras without a leading zero and legacy FlashXX tags are accepted', function()
    local vcf, problems = Vcf.parse(vcfXml([[
        <EOVERRIDE><Extra1 /></EOVERRIDE>
        <PATTERN><PRIMARY><Flash01 Duration="50" Extras="01" /></PRIMARY></PATTERN>
    ]]))

    Eq(#problems, 0, table.concat(problems, '; '))
    assert(vcf.extras[1], 'Extra1 parsed as extra 1')
    Eq(vcf.stages[1].patterns[1][1].extras[1], 1, 'leading zero removed in flash')
    Eq(vcf.stages[1].patterns[1][1].duration, 50, 'duration')
end)

Test('files that are not a VCF are rejected', function()
    for _, xml in ipairs({ '', 'not xml at all <', '<?xml version="1.0"?><other />' }) do
        local vcf, problems = Vcf.parse(xml)

        Eq(vcf, nil, 'vcf for ' .. xml)
        Eq(#problems, 1, 'problems for ' .. xml)
    end
end)

Test('common mistakes are reported but the VCF stays usable', function()
    local vcf, problems = Vcf.parse(vcfXml([[
        <EOVERRIDE><Extra01 /><Lamp /></EOVERRIDE>
        <PATTERN>
            <PRIMARY><Flash Duration="fast" Extras="1,5" Miscs="a,@" /></PRIMARY>
            <TERTIARY />
        </PATTERN>
    ]]))

    assert(vcf, 'VCF should still be usable')

    local all = table.concat(problems, '\n')
    for _, expected in ipairs({
        'unknown light <Lamp>',
        'invalid Duration "fast"',
        'Extra5 is not declared',
        'MiscA is not declared',
        'unknown pattern <TERTIARY>',
    }) do
        assert(all:find(expected, 1, true), 'missing problem "' .. expected .. '" in:\n' .. all)
    end

    Eq(vcf.stages[1].patterns[1][1].duration, 100, 'invalid duration falls back to 100')
end)

Test('MainHorn InterruptSiren is parsed, off by default', function()
    local vcf = Vcf.parse(vcfXml('<SOUNDS><MainHorn AllowUse="true" InterruptSiren="true" /></SOUNDS>'))
    Eq(vcf.sounds.mainHorn.interruptSiren, true, 'enabled')

    vcf = Vcf.parse(vcfXml('<SOUNDS><MainHorn AllowUse="true" /></SOUNDS>'))
    Eq(vcf.sounds.mainHorn.interruptSiren, false, 'default')
end)

Test('backwards compatible: K drives the REARREDS pattern and L the SECONDARY pattern, as in 2.x', function()
    local vcf = Vcf.parse(vcfXml([[
        <EOVERRIDE><Extra01 /><Extra02 /><Extra03 /></EOVERRIDE>
        <PATTERN>
            <PRIMARY><Flash Extras="1" /></PRIMARY>
            <SECONDARY EnableWarningBeep="true"><Flash Extras="3" /></SECONDARY>
            <REARREDS IsEmergency="false"><Flash Extras="2" /></REARREDS>
        </PATTERN>
    ]]))

    Eq(vcf.stages[2].patterns[1][1].extras[1], 2, 'stage 2 (K) = REARREDS')
    Eq(vcf.stages[2].isEmergency, false, 'REARREDS attributes kept')
    Eq(vcf.stages[3].patterns[1][1].extras[1], 3, 'stage 3 (L) = SECONDARY')
    Eq(vcf.stages[3].enableWarningBeep, true, 'SECONDARY attributes kept')
end)

Test('STAGES: up to 10 stages, several patterns per stage and steady lights', function()
    local vcf, problems = Vcf.parse(vcfXml([[
        <EOVERRIDE><Extra01 /><Extra02 /><Extra05 /><Extra11 /><MiscA /></EOVERRIDE>
        <STAGES>
            <Stage Number="1" Name="Front" FlashHighBeam="true" Extras="11" Miscs="a">
                <Pattern><Flash Duration="100" Extras="1" /><Flash Duration="100" Extras="2" /></Pattern>
                <Pattern><Flash Duration="700" Extras="5" /></Pattern>
            </Stage>
            <Stage Number="4" Name="Scene" IsEmergency="false" />
        </STAGES>
    ]]))

    Eq(#problems, 0, table.concat(problems, '; '))
    Eq(#vcf.stages, 4, 'gaps are filled up to the highest number')
    Eq(vcf.stages[1].name, 'Front', 'name')
    Eq(#vcf.stages[1].patterns, 2, 'two patterns')
    Eq(vcf.stages[1].patterns[2][1].duration, 700, 'second pattern')
    Eq(table.concat(vcf.stages[1].extras, ','), '11', 'steady extras')
    Eq(vcf.stages[1].miscs[1], ConvertMiscNameToId('a'), 'steady miscs')
    Eq(vcf.stages[2].name, 'Stage 2', 'empty stage in a gap')
    Eq(#vcf.stages[2].patterns, 0, 'gap has no patterns')
    Eq(vcf.stages[4].isEmergency, false, 'attributes')
end)

Test('STAGES: invalid numbers, duplicates and mixed formats are reported', function()
    local _, problems = Vcf.parse(vcfXml([[
        <STAGES>
            <Stage Number="0" />
            <Stage Number="11" />
            <Stage />
            <Stage Number="2" /><Stage Number="2" />
            <Stage Number="3"><Flash /></Stage>
        </STAGES>
        <PATTERN><PRIMARY /></PATTERN>
    ]]))

    local all = table.concat(problems, '\n')
    for _, expected in ipairs({
        'Number must be 1 to 10, got "0"',
        'got "11"',
        'got "nil"',
        'stage 2 is defined twice',
        'Stage 3: unknown element <Flash>',
        'use either <PATTERN> or <STAGES>',
    }) do
        assert(all:find(expected, 1, true), 'missing problem "' .. expected .. '" in:\n' .. all)
    end
end)

local function same(a, b, path)
    if type(a) ~= 'table' or type(b) ~= 'table' then
        if a ~= b then error(path .. ': ' .. tostring(a) .. ' ~= ' .. tostring(b), 0) end
        return
    end
    for k, v in pairs(a) do same(v, b[k], path .. '.' .. tostring(k)) end
    for k in pairs(b) do if a[k] == nil then error(path .. '.' .. tostring(k) .. ' only in the new file', 0) end end
end

for _, file in ipairs({ 'Example.xml', 'Example_ServerSideSIrens.xml' }) do
    Test('backwards compatible: the 2.x ' .. file .. ' and its STAGES version are read identically', function()
        local legacy, legacyProblems = Vcf.parse(ReadFile('tests/fixtures/legacy/' .. file))
        local current = Vcf.parse(ReadFile('resource/xmlFiles/' .. file))

        Eq(#legacyProblems, 0, table.concat(legacyProblems, '; '))
        same(legacy, current, file)
    end)
end
