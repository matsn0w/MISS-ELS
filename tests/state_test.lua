local vcf = Vcf.parse(ReadFile('resource/xmlFiles/Example.xml'))

local function on(...)
    local stages = {}
    for _, number in ipairs({ ... }) do stages[number] = true end
    return { stages = stages }
end

Test('state starts with everything off, one entry per stage of the vehicle', function()
    local state = ElsState.apply(nil, {}, vcf, false)

    Eq(#state.stages, 3, 'Example.xml has 3 stages')
    Eq(state.stages[1], false, 'stage 1')
    Eq(state.siren, 0, 'siren')
    Eq(state.horn, false, 'horn')
end)

Test('light stages toggle independently', function()
    local state = ElsState.apply(nil, on(1), vcf, false)
    state = ElsState.apply(state, on(3), vcf, false)

    Eq(state.stages[1], true, 'stage 1')
    Eq(state.stages[2], false, 'stage 2')
    Eq(state.stages[3], true, 'stage 3')

    state = ElsState.apply(state, { stages = { [1] = false } }, vcf, false)
    Eq(state.stages[1], false, 'turned off')
end)

Test('stages the vehicle does not have are ignored', function()
    local state = ElsState.apply(nil, { stages = { [4] = true, [10] = 'toggle', x = true } }, vcf, false)

    Eq(#state.stages, 3, 'still 3 stages')
    Eq(state.stages[4], nil, 'no stage 4')
end)

Test('the siren needs stage 1 unless always allowed', function()
    Eq(ElsState.apply(nil, { siren = 1 }, vcf, false).siren, 0, 'without lights')
    Eq(ElsState.apply(nil, { siren = 1 }, vcf, true).siren, 1, 'always allowed')
    Eq(ElsState.apply(ElsState.apply(nil, on(2), vcf, false), { siren = 1 }, vcf, false).siren, 0, 'stage 2 only')

    local lit = ElsState.apply(nil, on(1), vcf, false)
    Eq(ElsState.apply(lit, { siren = 3 }, vcf, false).siren, 3, 'with stage 1')
end)

Test('invalid or disabled siren tones are ignored', function()
    local lit = ElsState.apply(ElsState.apply(nil, on(1), vcf, false), { siren = 2 }, vcf, false)

    for _, siren in ipairs({ 5, -1, 1.5, '1', true }) do
        Eq(ElsState.apply(lit, { siren = siren }, vcf, false).siren, 2, 'siren ' .. tostring(siren))
    end

    local noTone4 = Vcf.parse('<vcfroot><PATTERN><PRIMARY /></PATTERN><SOUNDS><SrnTone4 AllowUse="false" /></SOUNDS></vcfroot>')
    Eq(ElsState.apply(lit, { siren = 4 }, noTone4, false).siren, 2, 'disabled tone')
end)

Test('turning the last light stage off stops the siren', function()
    local state = ElsState.apply(nil, on(1, 3), vcf, false)
    state = ElsState.apply(state, { siren = 1 }, vcf, false)

    state = ElsState.apply(state, { stages = { [1] = false } }, vcf, false)
    Eq(state.siren, 1, 'stage 3 still on')

    state = ElsState.apply(state, { stages = { [3] = false } }, vcf, false)
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
    local state = ElsState.apply(nil, on(1), vcf, false)

    for _, changes in ipairs({ 'primary', 42, { stages = 'all' }, { stages = { [1] = 'yes' }, horn = 1, extra = true } }) do
        local after = ElsState.apply(state, changes, vcf, false)
        Eq(after.stages[1], true, 'stage 1')
        Eq(after.extra, nil, 'no unknown keys')
    end
end)

Test('toggle flips the current value, so quick key presses never act on stale state', function()
    local state = ElsState.apply(nil, { stages = { [1] = 'toggle' } }, vcf, false)
    Eq(state.stages[1], true, 'first press')

    -- a second press sent before the client saw the first result still turns it off
    state = ElsState.apply(state, { stages = { [1] = 'toggle' } }, vcf, false)
    Eq(state.stages[1], false, 'second press')
end)

Test('flashing high beams are on by default and can be toggled', function()
    local state = ElsState.apply(nil, {}, vcf, false)
    Eq(state.highBeam, true, 'default')

    state = ElsState.apply(state, { highBeam = 'toggle' }, vcf, false)
    Eq(state.highBeam, false, 'toggled off')

    state = ElsState.apply(state, { highBeam = true }, vcf, false)
    Eq(state.highBeam, true, 'set on')

    Eq(ElsState.apply(state, { highBeam = 'off' }, vcf, false).highBeam, true, 'garbage ignored')
end)
