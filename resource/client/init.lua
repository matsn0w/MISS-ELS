kjEnabledVehicles = {}
kjxmlData = nil

AddEventHandler('onClientResourceStart', function(name)
    if not Config then
        CancelEvent()
        return
    end

    if name:lower() ~= GetCurrentResourceName():lower() then
        CancelEvent()
        return
    end

    -- load audio banks: RequestScriptAudioBank only returns true once the bank is loaded,
    -- calling it once is not enough on every machine (#184)
    Citizen.CreateThread(function()
        for _, bank in ipairs(Config.AudioBanks) do
            local timeout = GetGameTimer() + 10000

            while not RequestScriptAudioBank(bank, false) do
                if GetGameTimer() > timeout then
                    print('^1[MISS-ELS] Could not load audio bank ' .. bank .. ', sirens using it will be silent^7')
                    break
                end

                Citizen.Wait(100)
            end
        end
    end)
end)

RegisterNetEvent('kjELS:sendELSInformation')
-- the model lookup cache (GetCarHash) is per resource start, so this only ever receives the same data
AddEventHandler('kjELS:sendELSInformation', function(information) kjxmlData = information end)

RegisterNetEvent('kjELS:initVehicle')
AddEventHandler('kjELS:initVehicle', function()
    local vehicle = GetVehiclePedIsUsing(PlayerPedId())

    if kjEnabledVehicles[vehicle] == nil then AddVehicleToTable(vehicle) end
end)
