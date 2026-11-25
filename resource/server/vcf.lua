--- Pure VCF (vehicle configuration file) parser: no FiveM natives, so it runs in plain Lua tests.
--- Depends on the SLAXML global (lib/SLAXML.lua) and ConvertMiscNameToId (shared/funcs.lua).
Vcf = {}

local PATTERN_TYPES = { PRIMARY = 'primary', SECONDARY = 'secondary', REARREDS = 'rearreds' }

local function light(attr)
    local envLight = attr.AllowEnvLight == 'true'

    return {
        -- older VCFs don't have IsElsControlled, so default to true
        enabled = attr.IsElsControlled ~= 'false',
        env_light = envLight,
        env_pos = {
            x = envLight and tonumber(attr.OffsetX) or 0.0,
            y = envLight and tonumber(attr.OffsetY) or 0.0,
            z = envLight and tonumber(attr.OffsetZ) or 0.0,
        },
        env_color = envLight and string.upper(attr.Color or 'RED') or 'RED',
    }
end

--- @param name string element name like Extra01, Extra1 or MiscA
--- @return 'extra'|'misc'|nil kind, integer|nil id
local function lightId(name)
    local extra = name:match('^[Ee]xtra(%d+)$')
    if extra then return 'extra', tonumber(extra) end

    local misc = name:match('^[Mm]isc(%a)$')
    if misc then return 'misc', ConvertMiscNameToId(misc) end
end

--- Parse a VCF.
--- @param xml string the file contents
--- @return table|nil vcf the parsed config, nil if the file is unusable
--- @return string[] problems human readable problems, also for a usable file
function Vcf.parse(xml)
    local problems = {}
    local function problem(message) problems[#problems + 1] = message end

    local ok, doc = pcall(SLAXML.dom, SLAXML, xml or '')

    if not ok or not doc or not doc.root or doc.root.name ~= 'vcfroot' then
        problem('not a VCF: the file must be valid XML with a <vcfroot> element')
        return nil, problems
    end

    local vcf = {
        patterns = { primary = {}, secondary = {}, rearreds = {} },
        extras = {},
        miscs = {},
        statics = { extras = {}, miscs = {} },
        sounds = { nineMode = false },
    }

    for _, section in ipairs(doc.root.el) do
        if section.name == 'EOVERRIDE' then
            for _, elem in ipairs(section.el) do
                local kind, id = lightId(elem.name)

                if not id then
                    problem('EOVERRIDE: unknown light <' .. elem.name .. '>')
                else
                    vcf[kind .. 's'][id] = light(elem.attr)
                end
            end
        elseif section.name == 'STATIC' then
            for _, elem in ipairs(section.el) do
                local kind, id = lightId(elem.name)

                if not id then
                    problem('STATIC: unknown light <' .. elem.name .. '>')
                else
                    vcf.statics[kind .. 's'][id] = { name = elem.attr.Name }
                end
            end
        elseif section.name == 'SOUNDS' then
            for _, elem in ipairs(section.el) do
                local tone = elem.name:match('^SrnTone([1-4])$')

                if elem.name == 'MainHorn' then
                    vcf.sounds.mainHorn = {
                        allowUse = elem.attr.AllowUse == 'true',
                        audioString = elem.attr.AudioString or 'SIRENS_AIRHORN',
                        soundSet = elem.attr.SoundSet,
                    }
                elseif elem.name == 'NineMode' then
                    vcf.sounds.nineMode = elem.attr.AllowUse == 'true'
                elseif tone then
                    vcf.sounds['srnTone' .. tone] = {
                        allowUse = elem.attr.AllowUse == 'true',
                        audioString = elem.attr.AudioString,
                        soundSet = elem.attr.SoundSet,
                    }
                else
                    problem('SOUNDS: unknown element <' .. elem.name .. '>')
                end
            end
        elseif section.name == 'PATTERN' then
            for _, elem in ipairs(section.el) do
                local type = PATTERN_TYPES[elem.name:upper()]

                if not type then
                    problem('PATTERN: unknown pattern <' .. elem.name .. '>')
                else
                    local pattern = vcf.patterns[type]

                    pattern.isEmergency = elem.attr.IsEmergency ~= 'false'
                    pattern.flashHighBeam = elem.attr.FlashHighBeam == 'true'
                    pattern.enableWarningBeep = elem.attr.EnableWarningBeep == 'true'

                    -- Flash and the older FlashXX tags
                    for _, flashElem in ipairs(elem.el) do
                        if flashElem.name:upper():sub(1, 5) == 'FLASH' then
                            local where = type .. ' flash ' .. (#pattern + 1)
                            local duration = tonumber(flashElem.attr.Duration or '100')

                            if not duration or duration <= 0 then
                                problem(where .. ': invalid Duration "' .. tostring(flashElem.attr.Duration) .. '"')
                                duration = 100
                            end

                            local flash = { duration = duration, extras = {}, miscs = {} }

                            for extra in (flashElem.attr.Extras or ''):gmatch('%d+') do
                                flash.extras[#flash.extras + 1] = tonumber(extra)
                            end

                            for misc in (flashElem.attr.Miscs or ''):gmatch('%a+') do
                                local id = ConvertMiscNameToId(misc)

                                if id then
                                    flash.miscs[#flash.miscs + 1] = id
                                else
                                    problem(where .. ': unknown misc "' .. misc .. '"')
                                end
                            end

                            pattern[#pattern + 1] = flash
                        end
                    end
                end
            end
        end
    end

    -- the most common mistake: flashing a light that EOVERRIDE doesn't declare, so it never lights up
    for type, pattern in pairs(vcf.patterns) do
        for i, flash in ipairs(pattern) do
            for _, extra in ipairs(flash.extras) do
                if not vcf.extras[extra] then
                    problem(type .. ' flash ' .. i .. ': Extra' .. extra .. ' is not declared in EOVERRIDE, so it is not reset when the lights change')
                end
            end

            for _, misc in ipairs(flash.miscs) do
                if not vcf.miscs[misc] then
                    problem(type .. ' flash ' .. i .. ': Misc' .. ConvertMiscIdToName(misc):upper() .. ' is not declared in EOVERRIDE, so it is not reset when the lights change')
                end
            end
        end
    end

    return vcf, problems
end
