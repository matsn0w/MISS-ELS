-- Minimal test runner for the pure-Lua parts of MISS-ELS (no FiveM natives).
-- Run from the repository root: lua tests/run.lua

local failed, passed = 0, 0

function Test(name, fn)
    local ok, err = pcall(fn)

    if ok then
        passed = passed + 1
    else
        failed = failed + 1
        print('FAIL ' .. name .. '\n     ' .. tostring(err))
    end
end

function Eq(actual, expected, label)
    if actual ~= expected then
        error((label or 'value') .. ': expected ' .. tostring(expected) .. ', got ' .. tostring(actual), 2)
    end
end

function ReadFile(path)
    local file = assert(io.open(path, 'rb'))
    local content = file:read('a')
    file:close()
    return content
end

-- the resource code under test, loaded the way fxmanifest loads it (as globals)
dofile('resource/lib/SLAXML.lua')
dofile('resource/shared/funcs.lua')
dofile('resource/server/vcf.lua')

dofile('tests/vcf_test.lua')

print(passed .. ' passed, ' .. failed .. ' failed')
os.exit(failed == 0 and 0 or 1)
