--- VCFs keyed by model hash, filled when the VCFs are loaded (server/init.lua)
VcfByModel = {}

--- Whether this player may control the ELS of this vehicle
local function canControl(source, vehicle)
    local ped = GetPlayerPed(source)

    if GetPedInVehicleSeat(vehicle, -1) == ped then return true end

    return Config.AllowPassengers == true and GetVehiclePedIsIn(ped, false) == vehicle
end

-- clients request a change, the server validates it and writes the replicated 'els' state bag
RegisterNetEvent('MISS-ELS:requestState', function(netId, changes)
    local source = source
    local vehicle = NetworkGetEntityFromNetworkId(tonumber(netId) or 0)

    if vehicle == 0 or not DoesEntityExist(vehicle) or not canControl(source, vehicle) then return end

    local vcf = VcfByModel[GetEntityModel(vehicle)]
    if not vcf then return end

    local state = Entity(vehicle).state
    state:set('els', ElsState.apply(state.els, changes, vcf, Config.SirenAlwaysAllowed), true)
end)

RegisterNetEvent('kjELS:sv_Indicator')
AddEventHandler('kjELS:sv_Indicator', function(direction, toggle)
    TriggerClientEvent('kjELS:updateIndicators', source, direction, toggle)
end)
