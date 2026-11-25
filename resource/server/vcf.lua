--- Pure VCF (vehicle configuration file) parser: no FiveM natives, so it runs in plain Lua tests.
--- Depends on the SLAXML global (lib/SLAXML.lua) and ConvertMiscNameToId (shared/funcs.lua).
Vcf = {}

Vcf.MAX_STAGES = 10

-- the 2.x <PATTERN> format: which light stage each pattern drives, unchanged so old VCFs keep their keys
-- (Q = primary, K = rearreds, L = secondary)
local LEGACY_STAGES = { PRIMARY = 1, REARREDS = 2, SECONDARY = 3 }
local LEGACY_NAMES = { 'Primary', 'Secondary', 'Warning' }

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
        stages = {},
        extras = {},
        miscs = {},
        statics = { extras = {}, miscs = {} },
        sounds = { nineMode = false },
    }

    --- Extras="1,2" and Miscs="a,b" attributes
    local function parseLights(attr, where)
        local extras, miscs = {}, {}

        for extra in (attr.Extras or ''):gmatch('%d+') do
            extras[#extras + 1] = tonumber(extra)
        end

        for misc in (attr.Miscs or ''):gmatch('%a+') do
            local id = ConvertMiscNameToId(misc)

            if id then
                miscs[#miscs + 1] = id
            else
                problem(where .. ': unknown misc "' .. misc .. '"')
            end
        end

        return extras, miscs
    end

    --- The <Flash> children of an element (also the older FlashXX tags)
    local function parseFlashes(elem, where)
        local pattern = {}

        for _, flashElem in ipairs(elem.el) do
            if flashElem.name:upper():sub(1, 5) == 'FLASH' then
                local flashWhere = where .. ' flash ' .. (#pattern + 1)
                local duration = tonumber(flashElem.attr.Duration or '100')

                if not duration or duration <= 0 then
                    problem(flashWhere .. ': invalid Duration "' .. tostring(flashElem.attr.Duration) .. '"')
                    duration = 100
                end

                local extras, miscs = parseLights(flashElem.attr, flashWhere)
                pattern[#pattern + 1] = { duration = duration, extras = extras, miscs = miscs }
            end
        end

        return pattern
    end

    local function newStage(attr, name)
        return {
            name = name,
            isEmergency = attr.IsEmergency ~= 'false',
            flashHighBeam = attr.FlashHighBeam == 'true',
            enableWarningBeep = attr.EnableWarningBeep == 'true',
            -- lights that stay on while the stage is active (#107)
            extras = {},
            miscs = {},
            patterns = {},
        }
    end

    local hasLegacy, hasStages = false, false

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
                        -- the horn silences the siren while it sounds (#179)
                        interruptSiren = elem.attr.InterruptSiren == 'true',
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
            hasLegacy = true
            -- 2.x format: one pattern per stage
            for _, elem in ipairs(section.el) do
                local number = LEGACY_STAGES[elem.name:upper()]

                if not number then
                    problem('PATTERN: unknown pattern <' .. elem.name .. '>')
                else
                    local stage = newStage(elem.attr, LEGACY_NAMES[number])
                    stage.patterns[1] = parseFlashes(elem, stage.name)
                    vcf.stages[number] = stage
                end
            end
        elseif section.name == 'STAGES' then
            hasStages = true
            -- 3.x format: up to 10 stages, each with any number of patterns running at once
            for _, elem in ipairs(section.el) do
                local number = tonumber(elem.attr.Number)

                if elem.name ~= 'Stage' then
                    problem('STAGES: unknown element <' .. elem.name .. '>')
                elseif not number or number % 1 ~= 0 or number < 1 or number > Vcf.MAX_STAGES then
                    problem('STAGES: Number must be 1 to ' .. Vcf.MAX_STAGES .. ', got "' .. tostring(elem.attr.Number) .. '"')
                elseif vcf.stages[number] then
                    problem('STAGES: stage ' .. number .. ' is defined twice')
                else
                    local stage = newStage(elem.attr, elem.attr.Name or ('Stage ' .. number))
                    stage.extras, stage.miscs = parseLights(elem.attr, stage.name)

                    for _, patternElem in ipairs(elem.el) do
                        if patternElem.name == 'Pattern' then
                            stage.patterns[#stage.patterns + 1] =
                                parseFlashes(patternElem, stage.name .. ' pattern ' .. (#stage.patterns + 1))
                        else
                            problem(stage.name .. ': unknown element <' .. patternElem.name .. '>')
                        end
                    end

                    vcf.stages[number] = stage
                end
            end
        end
    end

    if hasLegacy and hasStages then
        problem('use either <PATTERN> or <STAGES>, not both')
    end

    -- fill gaps (e.g. only stage 1 and 3), so the stages are a plain list
    local count = 0
    for number in pairs(vcf.stages) do count = math.max(count, number) end
    for number = 1, count do
        vcf.stages[number] = vcf.stages[number] or newStage({}, 'Stage ' .. number)
    end

    -- the most common mistake: a light that EOVERRIDE doesn't declare, so it is not reset when the lights change
    local function checkDeclared(extras, miscs, where)
        for _, extra in ipairs(extras) do
            if not vcf.extras[extra] then
                problem(where .. ': Extra' .. extra .. ' is not declared in EOVERRIDE, so it is not reset when the lights change')
            end
        end

        for _, misc in ipairs(miscs) do
            if not vcf.miscs[misc] then
                problem(where .. ': Misc' .. ConvertMiscIdToName(misc):upper() .. ' is not declared in EOVERRIDE, so it is not reset when the lights change')
            end
        end
    end

    for _, stage in ipairs(vcf.stages) do
        checkDeclared(stage.extras, stage.miscs, stage.name)

        for p, pattern in ipairs(stage.patterns) do
            for i, flash in ipairs(pattern) do
                local where = stage.name .. (#stage.patterns > 1 and (' pattern ' .. p) or '') .. ' flash ' .. i
                checkDeclared(flash.extras, flash.miscs, where)
            end
        end
    end

    return vcf, problems
end
