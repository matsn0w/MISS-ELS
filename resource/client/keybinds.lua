-- statics menu
RegisterKeyMapping('MISS-ELS:open-statics-menu', 'Open statics menu', 'KEYBOARD', 'U')

-- indicators
RegisterKeyMapping('MISS-ELS:toggle-indicator-hazard', 'Toggle hazard lights', 'KEYBOARD', 'DOWN')
RegisterKeyMapping('MISS-ELS:toggle-indicator-left', 'Toggle left indicator', 'KEYBOARD', 'LEFT')
RegisterKeyMapping('MISS-ELS:toggle-indicator-right', 'Toggle right indicator', 'KEYBOARD', 'RIGHT')

-- light stages
RegisterKeyMapping('MISS-ELS:toggle-stage-primary', 'Toggle primary lights', 'KEYBOARD', 'Q')
RegisterKeyMapping('MISS-ELS:toggle-stage-secondary', 'Toggle secondary lights', 'KEYBOARD', 'K')
RegisterKeyMapping('MISS-ELS:toggle-stage-warning', 'Toggle warning lights', 'KEYBOARD', 'L')

-- extra light stages for VCFs that define them; no default key, players bind them in the FiveM settings (#202)
for number = 4, 10 do
    RegisterKeyMapping('MISS-ELS:toggle-stage-' .. number, 'Toggle light stage ' .. number, 'KEYBOARD', '')
end

-- sirens
RegisterKeyMapping('MISS-ELS:toggle-siren', 'Toggle sirens', 'KEYBOARD', 'LMENU') -- LEFT ALT
RegisterKeyMapping('MISS-ELS:toggle-siren-next', 'Toggle next siren', 'KEYBOARD', 'R')
RegisterKeyMapping('MISS-ELS:toggle-siren-one', 'Toggle siren 1', 'KEYBOARD', '1')
RegisterKeyMapping('MISS-ELS:toggle-siren-two', 'Toggle siren 2', 'KEYBOARD', '2')
RegisterKeyMapping('MISS-ELS:toggle-siren-three', 'Toggle siren 3', 'KEYBOARD', '3')
RegisterKeyMapping('MISS-ELS:toggle-siren-four', 'Toggle siren 4', 'KEYBOARD', '4')
