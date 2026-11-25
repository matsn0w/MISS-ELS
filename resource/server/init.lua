kjxmlData = {}
local systemOS = nil

local function checkForUpdate()
    local versionFile = LoadResourceFile(GetCurrentResourceName(), 'version.json')

    if not versionFile then
        print('Couldn\'t read version file!')
        return
    end

    local currentVersion = Semver(json.decode(versionFile)['version'] or 'unknown')

    if currentVersion.prerelease then
        print('WARNING: you are using a pre-release of MISS ELS!')
        print('>> This version might be unstable and probably contains some bugs.')
        print('>> Please report bugs and other problems via https://github.com/matsn0w/MISS-ELS/issues')
    end

    PerformHttpRequest('https://api.github.com/repos/matsn0w/MISS-ELS/releases/latest', function(status, response, headers)
        if status ~= 200 then
            print('Something went wrong! Couldn\'t fetch latest version. Status: ' .. tostring(status))
            return
        end

        local newVersion = Semver(json.decode(response)['tag_name'] or 'unknown')

        if newVersion > currentVersion then
            print('---------------------------- MISS ELS ----------------------------')
            print('--------------------- NEW VERSION AVAILABLE! ---------------------')
            print('>> You are using v' .. tostring(currentVersion))
            print('>> You can upgrade to v' .. tostring(newVersion))
            print()
            print('Download it at https://github.com/matsn0w/MISS-ELS/releases/latest')
            print('------------------------------------------------------------------')
        end
    end)
end

--- Determine the server OS without relying on environment variables.
--- HOME / HOMEPATH are not set on many hosts (txAdmin, game panels, services), see #190.
--- @return 'windows'|'unix'
local function determineOS()
    -- the directory separator of the Lua runtime itself is the most reliable signal
    if package and type(package.config) == 'string' then
        return package.config:sub(1, 1) == '\\' and 'windows' or 'unix'
    end

    -- fall back to the resource path: Windows paths start with a drive letter
    local resourcePath = GetResourcePath(GetCurrentResourceName()) or ''

    return resourcePath:match('^%a:[/\\]') and 'windows' or 'unix'
end

--- @param filename string
--- @return boolean
local function isVcfFile(filename)
    return filename:lower():match('%.xml$') ~= nil
end

--- List the VCF files in a folder by asking the OS shell.
--- @param folder string
--- @return string[]|nil files, string|nil error
local function scanDir(folder)
    if not io or not io.popen then
        return nil, 'io.popen is not available on this server'
    end

    local resourcePath = GetResourcePath(GetCurrentResourceName())
    local command

    if systemOS == 'windows' then
        command = 'dir /B "' .. resourcePath:gsub('/', '\\') .. '\\' .. folder .. '"'
    else
        command = 'ls -A "' .. resourcePath .. '/' .. folder .. '"'
    end

    local ok, pfile = pcall(io.popen, command)

    if not ok or not pfile then
        return nil, 'could not list directory: ' .. tostring(pfile)
    end

    local files = {}

    for line in pfile:lines() do
        -- strip whitespace and carriage returns from the shell output
        local filename = line:match('^%s*(.-)%s*$')

        -- skip anything that is not an XML file (sub folders, desktop.ini, shell messages, ...)
        if filename ~= '' and isVcfFile(filename) then
            files[#files + 1] = filename
        end
    end

    pfile:close()

    return files
end

--- Determine which VCF files should be loaded.
--- Config.VCFFiles takes precedence, so server owners on locked-down hosts can list files explicitly.
--- @param folder string
--- @return string[]
local function getVcfFiles(folder)
    if type(Config.VCFFiles) == 'table' and #Config.VCFFiles > 0 then
        return Config.VCFFiles
    end

    local files, err = scanDir(folder)

    if not files then
        print('^1[MISS-ELS] Couldn\'t scan the ' .. folder .. ' folder (' .. err .. ').^7')
        print('^1[MISS-ELS] List your VCF files in Config.VCFFiles instead, see config.example.lua.^7')
        return {}
    end

    if #files == 0 then
        print('^3[MISS-ELS] Couldn\'t find any VCF files in ' .. folder .. '. Are they in the correct directory?^7')
    end

    return files
end

local function loadFile(file)
    return LoadResourceFile(GetCurrentResourceName(), file)
end

AddEventHandler('onResourceStart', function(name)
    if not Config then
        error('You probably forgot to copy the example configuration file. Please see the installation instructions for further details.')
        StopResource(GetCurrentResourceName())
        CancelEvent()
        return
    end

    if name:lower() ~= GetCurrentResourceName():lower() then
        CancelEvent()
        return
    end

    Citizen.CreateThread(function()
        checkForUpdate()
    end)

    local folder = 'xmlFiles'

    -- determine the server OS
    systemOS = determineOS()

    for _, file in ipairs(getVcfFiles(folder)) do
        local ok, data = pcall(loadFile, folder .. '/' .. file)

        if not ok then data = nil end

        if data then
            local vcf, problems = Vcf.parse(data)

            for _, problem in ipairs(problems) do
                print('^3[MISS-ELS] ' .. file .. ': ' .. problem .. '^7')
            end

            if vcf then
                -- the model name is the file name without .xml
                kjxmlData[file:sub(1, -5)] = vcf
                print('Parsed VCF for: ' .. file)
            else
                print('^1[MISS-ELS] VCF file ' .. file .. ' could not be parsed and is skipped^7')
            end
        else
            print('VCF file ' .. file .. ' not found: does the file exist?')
        end
    end

    -- send the ELS data to all clients
    TriggerClientEvent('kjELS:sendELSInformation', -1, kjxmlData)
end)

RegisterServerEvent('kjELS:requestELSInformation')
AddEventHandler('kjELS:requestELSInformation', function()
    TriggerClientEvent('kjELS:sendELSInformation', source, kjxmlData)
end)

RegisterNetEvent('baseevents:enteredVehicle')
AddEventHandler('baseevents:enteredVehicle', function(veh, seat, name)
    TriggerClientEvent('kjELS:initVehicle', source)
end)
