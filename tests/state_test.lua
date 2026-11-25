local vcf = Vcf.parse(ReadFile('resource/xmlFiles/Example.xml'))

Test('state starts with everything off', function()
    local state = ElsState.apply(nil, {}, vcf, false)

    Eq(state.primary, false, 'primary')
    Eq(state.siren, 0, 'siren')
    Eq(state.horn, false, 'horn')
end)

Test('light stages toggle independently', function()
    local state = ElsState.apply(nil, { primary = true }, vcf, false)
    state = ElsState.apply(state, { warning = true }, vcf, false)

    Eq(state.primary, true, 'primary')
    Eq(state.warning, true, 'warning')
    Eq(state.secondary, false, 'secondary')
end)

Test('the siren needs the primary lights unless always allowed', function()
    Eq(ElsState.apply(nil, { siren = 1 }, vcf, false).siren, 0, 'without lights')
    Eq(ElsState.apply(nil, { siren = 1 }, vcf, true).siren, 1, 'always allowed')

    local lit = ElsState.apply(nil, { primary = true }, vcf, false)
    Eq(ElsState.apply(lit, { siren = 3 }, vcf, false).siren, 3, 'with primary lights')
end)

Test('invalid or disabled siren tones are ignored', function()
    local lit = ElsState.apply(nil, { primary = true, siren = 2 }, vcf, false)

    for _, siren in ipairs({ 5, -1, 1.5, '1', true }) do
        Eq(ElsState.apply(lit, { siren = siren }, vcf, false).siren, 2, 'siren ' .. tostring(siren))
    end

    local noTone4 = Vcf.parse('<vcfroot><SOUNDS><SrnTone4 AllowUse="false" /></SOUNDS></vcfroot>')
    Eq(ElsState.apply(lit, { siren = 4 }, noTone4, false).siren, 2, 'disabled tone')
end)

Test('turning the last light stage off stops the siren', function()
    local state = ElsState.apply(nil, { primary = true, warning = true, siren = 1 }, vcf, false)

    state = ElsState.apply(state, { primary = false }, vcf, false)
    Eq(state.siren, 1, 'warning lights still on')

    state = ElsState.apply(state, { warning = false }, vcf, false)
    Eq(state.siren, 0, 'all lights off')
end)

Test('the horn only works when the VCF allows it', function()
    -- Example.xml has <MainHorn> without AllowUse
    Eq(ElsState.apply(nil, { horn = true }, vcf, false).horn, false, 'not allowed')

    local hornVcf = Vcf.parse('<vcfroot><SOUNDS><MainHorn AllowUse="true" /></SOUNDS></vcfroot>')
    local state = ElsState.apply(nil, { horn = true }, hornVcf, false)
    Eq(state.horn, true, 'allowed')
    Eq(ElsState.apply(state, { horn = false }, hornVcf, false).horn, false, 'released')
end)

Test('garbage requests leave the state unchanged', function()
    local state = ElsState.apply(nil, { primary = true }, vcf, false)

    for _, changes in ipairs({ 'primary', 42, { primary = 'yes', horn = 1, extra = true } }) do
        local after = ElsState.apply(state, changes, vcf, false)
        Eq(after.primary, true, 'primary')
        Eq(after.extra, nil, 'no unknown keys')
    end
end)
