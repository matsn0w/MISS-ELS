--- VCFs keyed by model hash, filled when the VCFs are loaded (server/init.lua)
VcfByModel = {}

--- Whether this player may control the ELS of this vehicle
local function canControl(source, vehicle)
    local ped = GetPlayerPed(source)

    if GetPedInVehicleSeat(vehicle, -1) == ped then return true end

    return Config.AllowPassengers == true and GetVehiclePedIsIn(ped, false) == vehicle
end

--- Apply changes to a vehicle's ELS state and sync it to everyone. The only place the 'els' state bag is written.
--- @return boolean applied false when the vehicle doesn't exist or has no VCF
local function setVehicleState(vehicle, changes)
    if not vehicle or vehicle == 0 or not DoesEntityExist(vehicle) then return false end

    local vcf = VcfByModel[GetEntityModel(vehicle)]
    if not vcf then return false end

    local state = Entity(vehicle).state
    state:set('els', ElsState.apply(state.els, changes, vcf, Config.SirenAlwaysAllowed), true)

    return true
end

-- clients request a change; only the driver (or an allowed passenger) may change the vehicle
RegisterNetEvent('MISS-ELS:requestState', function(netId, changes)
    local vehicle = NetworkGetEntityFromNetworkId(tonumber(netId) or 0)

    if vehicle ~= 0 and canControl(source, vehicle) then setVehicleState(vehicle, changes) end
end)

-- for other resources, e.g. AI vehicles (#166): exports['MISS-ELS']:SetVehicleState(vehicle, { primary = true, siren = 1 })
-- trusted, so no driver check; the same rules apply (see server/state.lua)
exports('SetVehicleState', setVehicleState)
exports('GetVehicleState', function(vehicle) return Entity(vehicle).state.els end)

RegisterNetEvent('kjELS:sv_Indicator')
AddEventHandler('kjELS:sv_Indicator', function(direction, toggle)
    TriggerClientEvent('kjELS:updateIndicators', source, direction, toggle)
end)
