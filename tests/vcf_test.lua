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
    Eq(vcf.sounds.nineMode, false, 'nine mode')
    Eq(vcf.sounds.srnTone1.audioString, 'VEHICLES_HORNS_SIREN_1', 'tone 1')
    Eq(vcf.sounds.srnTone4.allowUse, true, 'tone 4 allowed')

    local primary = vcf.patterns.primary
    Eq(primary.flashHighBeam, true, 'primary flashes high beam')
    Eq(primary.isEmergency, true, 'primary is emergency by default')
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
    Eq(vcf.patterns.primary[1].extras[1], 1, 'leading zero removed in flash')
    Eq(vcf.patterns.primary[1].duration, 50, 'duration')
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

    Eq(vcf.patterns.primary[1].duration, 100, 'invalid duration falls back to 100')
end)
