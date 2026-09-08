if (DragonAuras === undefined) var DragonAuras = {};

DragonAuras.id = 'DragonAuras';
DragonAuras.name = 'Dragon Auras';
DragonAuras.version = '1.0';

// Gets the current list of auras as IDs if any are set
DragonAuras.get = function() {
    let ret = [];
    if (Game.dragonAura !== 0) {
        ret.push(Game.dragonAura);
    }
    if (Game.dragonAura2 !== 0) {
        ret.push(Game.dragonAura2);
    }
    return ret;
};

// Update the to the desired aura(s). The input may be either a single aura name or ID, or a list of
// desired names and/or IDs. The list may be longer than 2 in which case the earlier elements in the
// list have preference if they are allowed to be set. Returns the map of buildings that were
// sacrificed as an object that can be passed to rebuy() (key is the building ID and value is the
// count). If nothing was updated, null is returned. Partial updates can happen if not all auras are
// unlocked, these can be detected by first calling canFullyUpdate(desired).
DragonAuras.update = function(desired) {
    const auraIds = DragonAuras.normalizeToIds(desired)
        .filter(auraId => DragonAuras.auraIdAllowed(auraId))
        .slice(0, 2);
    let slotsAllowed = [DragonAuras.slotAllowed(0), DragonAuras.slotAllowed(1)];
    let alreadyPresent = Array(auraIds.length).fill(false);

    for (const [idx, auraId] of auraIds.entries()) {
        if (slotsAllowed[0] && Game.dragonAura === auraId) {
            slotsAllowed[0] = false;
            alreadyPresent[idx] = true;
        } else if (slotsAllowed[1] && Game.dragonAura2 === auraId) {
            slotsAllowed[1] = false;
            alreadyPresent[idx] = true;
        }
    }

    let anyUpdates = false;
    let buildingCounts = {};
    for (const [idx, auraId] of auraIds.entries()) {
        if (alreadyPresent[idx]) {
            continue;
        }
        let wasUpdated = true;
        if (slotsAllowed[1] && Game.dragonAura2 === 0) {
            Game.dragonAura2 = auraId;
            slotsAllowed[1] = false;
        } else if (slotsAllowed[0]) {
            Game.dragonAura = auraId;
            slotsAllowed[0] = false;
        } else if (slotsAllowed[1]) {
            Game.dragonAura2 = auraId;
            slotsAllowed[1] = false;
        } else {
            wasUpdated = false;
        }

        if (wasUpdated) {
            Game.recalculateGains = 1;
            anyUpdates = true;
            const buildingId = DragonAuras.sacrificeBuilding();
            if (buildingId !== null) {
                buildingCounts[buildingId] = (buildingCounts[buildingId] || 0) + 1;
            }
        }
    }

    return anyUpdates ? buildingCounts : null;
};

// Helper to combine update and rebuy. Returns true if anything was updated
DragonAuras.updateWithRebuy = function(desired) {
    const buildingCounts = DragonAuras.update(desired);
    DragonAuras.rebuy(buildingCounts);
    return buildingCounts !== null;
};

DragonAuras.canFullyUpdate = function(desired) {
    const auraIds = DragonAuras.normalizeToIds(desired);
    // Consider fully updated if any 2 of the requested auras are allowed
    const requestedCount = Math.min(2, auraIds.length);
    const allowedCount = auraIds.filter(auraId => DragonAuras.auraIdAllowed(auraId))
        .slice(0, DragonAuras.allowedSlotCount());
    return allowedCount >= requestedCount;
};

// Rebuy the buildings previously sacrificed
DragonAuras.rebuy = function(buildingCounts) {
    if (buildingCounts) {
        for (const [buildingId, count] of Object.entries(buildingCounts)) {
            Game.ObjectsById[buildingId].buy(count);
        }
    }
};

DragonAuras.slotAllowed = function(slotId) {
    return (slotId === 0 && Game.dragonLevel >= 5) || (slotId === 1 && Game.dragonLevel >= 27);
};

DragonAuras.allowedSlotCount = function() {
    if (Game.dragonLevel >= 27) {
        return 2;
    } else if (Game.dragonLevel >= 5) {
        return 1;
    } else {
        return 0;
    }
};

DragonAuras.auraAllowed = function(aura) {
    return DragonAuras.auraIdAllowed(DragonAuras.auraToId(aura));
};

DragonAuras.auraIdAllowed = function(auraId) {
    return auraId !== null && Game.dragonLevel >= auraId + 4;
};

DragonAuras.auraToId = function(aura) {
    if (typeof(aura) === 'number' && aura in Game.dragonAuras) {
        return aura;
    } else if (typeof(aura) === 'string' && aura in Game.dragonAurasBN) {
        return Game.dragonAurasBN[aura].id;
    } else {
        return null;
    }
};

DragonAuras.auraToName = function(aura) {
    if (typeof(aura) === 'number' && aura in Game.dragonAuras) {
        return Game.dragonAuras[aura].name;
    } else if (typeof(aura) === 'string' && aura in Game.dragonAurasBN) {
        return aura;
    } else {
        return null;
    }
};

// Checks what the Game.auraMult() would be if we updated to desired, factoring in whether the
// updates are even allowed.
DragonAuras.auraMultAfterUpdate = function(desired) {
    const auraIds = DragonAuras.normalizeToIds(desired);
    const realityBendingAuraId = Game.dragonAurasBN['Reality Bending'].id;
    let idealAuraId = 0;
    for (const auraId of auraIds) {
        if (auraId !== realityBendingAuraId) {
            idealAuraId = auraId;
            break;
        }
    }

    const allowedAuraIds = new Set(auraIds.filter(auraId => DragonAuras.auraIdAllowed(auraId))
        .slice(0, DragonAuras.allowedSlotCount()));
    let n = 0;
    if (allowedAuraIds.has(idealAuraId)) { n += 1; }
    if (allowedAuraIds.has(realityBendingAuraId)) { n += 0.1; }
    return n;
};

DragonAuras.normalizeToIds = function(input) {
    if (input === null || input === undefined) {
        return [];
    } else if (typeof input[Symbol.iterator] === 'function') {
        let auraIds = [];
        for (const aura of input) {
            let auraId = DragonAuras.auraToId(aura);
            if (auraId !== null) {
                auraIds.push(auraId);
            }
        }
        return auraIds;
    } else {
        const auraId = DragonAuras.auraToId(input);
        if (auraId === null) {
            return [];
        } else {
            return [auraId];
        }
    }
};

// NOTE - returns null if there are no buildings
DragonAuras.sacrificeBuilding = function() {
    for (let i = Game.ObjectsById.length - 1; i >= 0; i--) {
        if (Game.ObjectsById[i].amount > 0) {
            Game.ObjectsById[i].sacrifice(1);
            return i;
        }
    }
    return null;
};

DragonAuras.init = function() {
    DragonAuras.isLoaded = true;
};
DragonAuras.save = function() {
    return '';
};
DragonAuras.load = function(str) {
};

if (!DragonAuras.isLoaded) {
    Game.registerMod(DragonAuras.id, DragonAuras);
}
