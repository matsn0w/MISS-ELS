local function ToggleExtra(vehicle, extra, toggle)
    -- the vehicle may have been deleted in the meantime (#188)
    if not DoesEntityExist(vehicle) then return end

    local value = toggle and 0 or 1

    SetVehicleAutoRepairDisabled(vehicle, true)
    SetVehicleExtra(vehicle, extra, value)
end

local function ToggleMisc(vehicle, misc, toggle)
    if not DoesEntityExist(vehicle) then return end

    SetVehicleModKit(vehicle, 0)
    -- mod -1 (the stock part) shows the light, 0 hides it; same as IsVehicleMiscTurnedOn and /misc
    -- TODO: respect custom wheel setting
    SetVehicleMod(vehicle, misc, toggle and -1 or 0, false)
end

local function SetLightStage(vehicle, stage, toggle)
    local ELSvehicle = kjEnabledVehicles[vehicle]
    local VCFdata = kjxmlData[GetCarHash(vehicle)]

    -- get the pattern data
    local patternData = VCFdata.patterns[ConvertStageToPattern(stage)]

    -- reset all extras and miscs
    TriggerEvent('kjELS:resetExtras', vehicle)
    TriggerEvent('kjELS:resetMiscs', vehicle)

    -- set the light state
    ELSvehicle[stage] = toggle

    if patternData.isEmergency then
        -- toggle the native siren ('emergency mode')
        SetVehicleSiren(vehicle, toggle)
    end

    if patternData.enableWarningBeep then
        Citizen.CreateThread(function()
            while ELSvehicle[stage] and DoesEntityExist(vehicle) do
                -- play warning sound
                SendNUIMessage({ transactionType = 'playSound', transactionFile = 'WarningBeep', transactionVolume = 0.2 })

                -- this should be equal to the length of the audio file
                Citizen.Wait((Config.WarningBeepDuration or 0) * 1000)
            end
        end)
    end
end

local function StaticsIncludesExtra(model, extra)
    return kjxmlData[model].statics.extras[extra] ~= nil
end

local function StaticsIncludesMisc(model, misc)
    return kjxmlData[model].statics.miscs[misc] ~= nil
end

RegisterNetEvent('kjELS:resetExtras')
AddEventHandler('kjELS:resetExtras', function(vehicle)
    if not vehicle or not DoesEntityExist(vehicle) then
        CancelEvent()
        return
    end

    local model = GetDisplayNameFromVehicleModel(GetEntityModel(vehicle))

    if not SetContains(kjxmlData, model) then
        CancelEvent()
        return
    end

    -- loop through all extra's
    for extra, info in pairs(kjxmlData[model].extras) do
        -- check if we can control this extra
        if info.enabled == true and not StaticsIncludesExtra(model, extra) then
            -- disable the extra (also disables auto repairs)
            ToggleExtra(vehicle, extra, false)
        end
    end
end)

RegisterNetEvent('kjELS:resetMiscs')
AddEventHandler('kjELS:resetMiscs', function(vehicle)
    if not vehicle or not DoesEntityExist(vehicle) then
        CancelEvent()
        return
    end

    local model = GetDisplayNameFromVehicleModel(GetEntityModel(vehicle))

    if not SetContains(kjxmlData, model) then
        CancelEvent()
        return
    end

    -- loop through all miscs
    for misc, info in pairs(kjxmlData[model].miscs) do
        -- check if we can control this misc
        if info.enabled == true and not StaticsIncludesMisc(model, misc) then
            -- disable the misc
            ToggleMisc(vehicle, misc, false)
        end
    end
end)

local function SetHorn(vehicle, ELSvehicle, status)
    ELSvehicle.horn = status

    -- stop the horn if it is honking
    if ELSvehicle.sound_id ~= nil then
        StopSound(ELSvehicle.sound_id)
        ReleaseSoundId(ELSvehicle.sound_id)

        ELSvehicle.sound_id = nil
    end

    if status then
        local mainHorn = kjxmlData[GetCarHash(vehicle)].sounds.mainHorn

        ELSvehicle.sound_id = GetSoundId()
        PlaySoundFromEntity(ELSvehicle.sound_id, mainHorn.audioString, vehicle, mainHorn.soundSet or 0, 0, 0)
    end
end

local function SetSiren(vehicle, ELSvehicle, status)
    ELSvehicle.siren = status

    -- stop the siren if it is playing
    if ELSvehicle.sound ~= nil then
        StopSound(ELSvehicle.sound)
        ReleaseSoundId(ELSvehicle.sound)

        ELSvehicle.sound = nil
    end

    local tone = kjxmlData[GetCarHash(vehicle)].sounds['srnTone' .. status]

    if tone then
        ELSvehicle.sound = GetSoundId()
        PlaySoundFromEntity(ELSvehicle.sound, tone.audioString, vehicle, tone.soundSet, 0, 0)
    end

    -- mute the native siren
    SetVehicleHasMutedSirens(vehicle, true)
end

--- Bring a vehicle in line with its synced 'els' state (see server/state.lua), changing only what differs
local function ApplyElsState(vehicle, state)
    if not kjxmlData or type(state) ~= 'table' or not DoesEntityExist(vehicle) or not IsELSVehicle(vehicle) then return end

    if kjEnabledVehicles[vehicle] == nil then AddVehicleToTable(vehicle) end

    local ELSvehicle = kjEnabledVehicles[vehicle]

    ELSvehicle.highBeamEnabled = state.highBeam ~= false

    for _, stage in ipairs({ 'primary', 'secondary', 'warning' }) do
        if (state[stage] == true) ~= ELSvehicle[stage] then SetLightStage(vehicle, stage, state[stage] == true) end
    end

    if (state.siren or 0) ~= ELSvehicle.siren then SetSiren(vehicle, ELSvehicle, state.siren or 0) end
    if (state.horn == true) ~= (ELSvehicle.horn == true) then SetHorn(vehicle, ELSvehicle, state.horn == true) end
end

-- instant updates for vehicles this client can see
AddStateBagChangeHandler('els', nil, function(bagName, _, value)
    local vehicle = GetEntityFromStateBagName(bagName)

    if vehicle ~= 0 then ApplyElsState(vehicle, value) end
end)

-- vehicles that come into range already have a state: pick it up
Citizen.CreateThread(function()
    while true do
        Citizen.Wait(500)

        for _, vehicle in ipairs(GetGamePool('CVehicle')) do
            local state = Entity(vehicle).state.els

            if state then ApplyElsState(vehicle, state) end
        end
    end
end)

RegisterNetEvent('kjELS:updateIndicators')
AddEventHandler('kjELS:updateIndicators', function(dir, toggle)
    local vehicle = GetVehiclePedIsIn(PlayerPedId())

    -- disable all indicators first
    SetVehicleIndicatorLights(vehicle, 1, false) -- 1 is left
    SetVehicleIndicatorLights(vehicle, 0, false) -- 0 is right

    if dir == 'left' then
        SetVehicleIndicatorLights(vehicle, 1, toggle)
    elseif dir == 'right' then
        SetVehicleIndicatorLights(vehicle, 0, toggle)
    elseif dir == 'hazard' then
        SetVehicleIndicatorLights(vehicle, 1, toggle)
        SetVehicleIndicatorLights(vehicle, 0, toggle)
    end
end)

local function CreateEnviromentLight(vehicle, light, offset, color)
    -- local boneIndex = GetEntityBoneIndexByName(vehicle, 'extra_' .. extra)
    local boneIndex = GetEntityBoneIndexByName(vehicle, light.type .. '_' .. tostring(light.name))
    local coords = GetWorldPositionOfEntityBone(vehicle, boneIndex)
    local position = coords + offset

    local rgb = { 0, 0, 0 }
    local range = Config.EnvironmentalLights.Range or 50.0
    local intensity = Config.EnvironmentalLights.Intensity or 1.0
    local shadow = 1.0

    if string.lower(color) == 'blue' then rgb = { 0, 0, 255 }
    elseif string.lower(color) == 'red' then rgb = { 255, 0, 0 }
    elseif string.lower(color) == 'green' then rgb = { 0, 255, 0 }
    elseif string.lower(color) == 'white' then rgb = { 255, 255, 255 }
    elseif string.lower(color) == 'amber' then rgb = { 255, 194, 0}
    end

    -- draw the light
    DrawLightWithRangeAndShadow(
        position.x, position.y, position.z,
        rgb[1], rgb[2], rgb[3],
        range, intensity, shadow
    )
end

Citizen.CreateThread(function()
    while true do
        -- wait for VCF data to load
        while not kjxmlData do Citizen.Wait(0) end

        -- synced across all clients, so everyone sees the same flash (#41)
        local now = GetNetworkTimeAccurate()

        for vehicle, ELSvehicle in pairs(kjEnabledVehicles) do
            local data = DoesEntityExist(vehicle) and kjxmlData[GetCarHash(vehicle)]

            if data then
                if ELSvehicle.primary or ELSvehicle.secondary or ELSvehicle.warning then
                    -- keep the engine on whilst the lights are activated
                    SetVehicleEngineOn(vehicle, true, true, false)

                    local extras, miscs = Pattern.litLights(data, ELSvehicle, now)
                    data.patternLights = data.patternLights or Pattern.lightsUsed(data)

                    -- compare with what is actually on: the owner's synced extras arrive a few frames
                    -- late on other clients and would otherwise linger (both sides lit at once)
                    for extra in pairs(data.patternLights.extras) do
                        local on = extras[extra] == true
                        if IsVehicleExtraTurnedOn(vehicle, extra) ~= on then ToggleExtra(vehicle, extra, on) end
                    end
                    for misc in pairs(data.patternLights.miscs) do
                        local on = miscs[misc] == true
                        if IsVehicleMiscTurnedOn(vehicle, misc) ~= on then ToggleMisc(vehicle, misc, on) end
                    end
                end

                -- flashing high beams, on the same clock as the patterns (#185)
                -- nil: not flashing (no stage with FlashHighBeam, or turned off in the menu)
                local highBeam = nil
                if ELSvehicle.highBeamEnabled then highBeam = Pattern.highBeamOn(data, ELSvehicle, now) end

                if highBeam ~= nil then
                    if not ELSvehicle.highBeam then
                        -- remember the lights to restore them later (booleans, or 0/1 on older runtimes)
                        local _, lightsOn, highbeamsOn = GetVehicleLightsState(vehicle)
                        ELSvehicle.highBeam = {
                            lightsOn = lightsOn == true or lightsOn == 1,
                            highbeamsOn = highbeamsOn == true or highbeamsOn == 1,
                        }

                        -- keep headlights that were off on for the whole stage, so the tail lights don't flash
                        if not ELSvehicle.highBeam.lightsOn then SetVehicleLights(vehicle, 2) end
                    end

                    SetVehicleFullbeam(vehicle, highBeam)
                    SetVehicleLightMultiplier(vehicle, highBeam and (Config.HighBeamIntensity or 5.0) or 1.0)
                elseif ELSvehicle.highBeam then
                    -- stopped flashing: restore the lights as they were
                    SetVehicleFullbeam(vehicle, ELSvehicle.highBeam.highbeamsOn)
                    SetVehicleLightMultiplier(vehicle, 1.0)
                    if not ELSvehicle.highBeam.lightsOn then SetVehicleLights(vehicle, 0) end

                    ELSvehicle.highBeam = nil
                end

                for extra, info in pairs(data.extras) do
                    if IsVehicleExtraTurnedOn(vehicle, extra) and info.env_light then
                        local offset = vector3(info.env_pos.x, info.env_pos.y, info.env_pos.z)
                        local light = {
                            type = 'extra',
                            name = extra
                        }

                        -- flash on walls
                        CreateEnviromentLight(vehicle, light, offset, info.env_color)
                    end
                end

                for misc, info in pairs(data.miscs) do
                    if IsVehicleMiscTurnedOn(vehicle, misc) and info.env_light then
                        local offset = vector3(info.env_pos.x, info.env_pos.y, info.env_pos.z)
                        local light = {
                            type = 'misc',
                            name = ConvertMiscIdToName(misc)
                        }

                        -- flash on walls
                        CreateEnviromentLight(vehicle, light, offset, info.env_color)
                    end
                end
            end
        end

        Citizen.Wait(0)
    end
end)

--- Stop a sound if it is playing and release its ID
local function ReleaseSound(soundId)
    if soundId == nil then return end

    StopSound(soundId)
    ReleaseSoundId(soundId)
end

-- clean up vehicles that were deleted, despawned or went out of range (#188, #140)
Citizen.CreateThread(function()
    while true do
        Citizen.Wait(1000)

        for vehicle, ELSvehicle in pairs(kjEnabledVehicles) do
            if not DoesEntityExist(vehicle) then
                -- stop all light stage threads
                ELSvehicle.primary = false
                ELSvehicle.secondary = false
                ELSvehicle.warning = false

                -- stop the siren and horn
                ReleaseSound(ELSvehicle.sound)
                ReleaseSound(ELSvehicle.sound_id)

                kjEnabledVehicles[vehicle] = nil
            end
        end
    end
end)
