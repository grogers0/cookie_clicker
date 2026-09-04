if (GrogeGardener === undefined) var GrogeGardener = {};
if (typeof CCSE == 'undefined') Game.LoadMod('https://klattmose.github.io/CookieClicker/CCSE.js');

GrogeGardener.name = 'Groge Gardener';
GrogeGardener.version = '0.1';

GrogeGardener.launch = function() {

    GrogeGardener.init = function() {
        GrogeGardener.isLoaded = true;
        GrogeGardener.isMinigameLoaded = false;
        GrogeGardener.config = GrogeGardener.defaultConfig();

        Game.customStatsMenu.push(function() {
            CCSE.AppendStatsVersionNumber(GrogeGardener.name, GrogeGardener.version);
        });
        Game.customOptionsMenu.push(function() {
            CCSE.AppendCollapsibleOptionsMenu(GrogeGardener.name, GrogeGardener.getMenuString());
        });

        CCSE.customSave.push(function() {
            CCSE.config.OtherMods.GrogeGardener = GrogeGardener.config;
        });
        CCSE.customLoad.push(function() {
            if (CCSE.config.OtherMods.GrogeGardener) {
                GrogeGardener.config = Object.assign(GrogeGardener.defaultConfig(),
                    CCSE.config.OtherMods.GrogeGardener);
            }

            if (GrogeGardener.isMinigameLoaded) {
                GrogeGardener.resetTimers();
            }
        });

        Game.Notify(GrogeGardener.name, 'Mod loaded', 1, 1);
        GrogeGardener.waitForMinigame();
    };

    GrogeGardener.waitForMinigame = function() {
        let container = document.getElementById('gardenPanel');
        if (!GrogeGardener.minigame() || !container) {
            setTimeout(GrogeGardener.waitForMinigame, 1000);
        } else {
            GrogeGardener.isMinigameLoaded = true;

            let title = document.createElement('div');
            title.id = 'GrogeGardener_title';
            title.className = 'title gardenPanelLabel';
            title.textContent = GrogeGardener.name;
            container.appendChild(title);

            let line = document.createElement('div');
            line.id = 'GrogeGardener_line';
            line.className = 'line';
            container.appendChild(line);

            let statusBox = document.createElement('div');
            statusBox.id = 'GrogeGardener_statusBox';
            statusBox.className = 'gardenPanelLabel';
            container.appendChild(statusBox);

            GrogeGardener.resetTimers();
        }
    };

    GrogeGardener.mutateMode = 'mutate';
    GrogeGardener.cookieDropMode = 'cookieDrop';
    GrogeGardener.goldenCookieMode = 'goldenCookie';
    GrogeGardener.defaultConfig = function() {
        return {
            running: false, // Start disabled to avoid conflict with other gardening mods
            mode: GrogeGardener.cookieDropMode,
            controlSoil: true,
            controlDragonAuras: false,
            rebuyAfterDragonAura: true,
            autoConvert: false,
            avoidPlantingDuringBuffs: false,
            maxBuffToPlant: 7, // e.g. 7x is frenzy
        };
    };

    GrogeGardener.updateStatus = function(str) {
        let statusBox = document.getElementById('GrogeGardener_statusBox');
        if (statusBox) {
            statusBox.textContent = str;
        }
    };

    GrogeGardener.mindOverMatterAura = 'Mind Over Matter';
    GrogeGardener.supremeIntellectAura = 'Supreme Intellect';
    GrogeGardener.realityBendingAura = 'Reality Bending';

    GrogeGardener.cookieDropOrder = function() {
        const plants = GrogeGardener.minigame().plants;
        return [
            plants.greenRot.id, // Adds random drop chance, do first
            plants.ichorpuff.id, // More sugar lumps
            plants.elderwort.id,
            plants.bakeberry.id,
            plants.bakerWheat.id,
            plants.duketater.id,
            plants.drowsyfern.id,
        ];
    };

    GrogeGardener.cookieDropUpgrades = function() {
        const plants = GrogeGardener.minigame().plants;
        return new Map([
            [plants.elderwort.id, 470],
            [plants.bakeberry.id, 471],
            [plants.duketater.id, 472],
            [plants.greenRot.id, 473],
            [plants.drowsyfern.id, 474],
            [plants.ichorpuff.id, 475],
            [plants.bakerWheat.id, 476],
        ]);
    };

    GrogeGardener.needsCookieDrop = function(plantId) {
        const minigame = GrogeGardener.minigame();
        let upgrades = GrogeGardener.cookieDropUpgrades();
        return upgrades.has(plantId) && minigame.plantsById[plantId].unlocked &&
            !Game.UpgradesById[upgrades.get(plantId)].unlocked;
    };


    GrogeGardener.plantUnlockOrder = function() {
        const plants = GrogeGardener.minigame().plants;
        return [
            plants.meddleweed.id,

            plants.bakeberry.id,
            plants.thumbcorn.id,
            plants.cronerice.id,

            plants.crumbspore.id,
            plants.brownMold.id,

            // TODO
        ];
    };

    GrogeGardener.optimalMutations = function() {
        const plants = GrogeGardener.minigame().plants;
        return new Map([
            [plants.meddleweed.id, new Map()],
            [plants.bakeberry.id, new Map([[plants.bakerWheat.id, 2]])],
            [plants.thumbcorn.id, new Map([[plants.bakerWheat.id, 2]])],
        ]);
    };

    // TODO - we can probably just assume this from the ageTick/ageTickR of the second plant?
    GrogeGardener.mutateBeforeUnlocking = function() {
        const plants = GrogeGardener.minigame().plants;
        return {
            [plants.crumbspore.id]: {
                [plants.wrinklegill.id]: plants.brownMold.id,
                [plants.glovemorel.id]: plants.thumbcorn.id,
            },
            [plants.whiteMildew]: { [-1]: plants.whiteMildew.id, },
            // FIXME
        };
    };

    GrogeGardener.minigame = function() {
        return Game.ObjectsById[2].minigame;
    };

    GrogeGardener.enableDebugMode = function() {
        // To iterate testing faster this can be manually enabled in the console
        AddEvent(document, 'keypress', function(e) {
            // Space instantly ticks the garden
            if (e.key == ' ') {
                const minigame = GrogeGardener.minigame();
                const now = Date.now();
                if (minigame.nextStep > now) {
                    const skipped = minigame.nextStep - now;
                    minigame.nextStep = now;
                    minigame.nextSoil -= skipped;
                    GrogeGardener.resetTimers();
                }
            }
        });
    };

    GrogeGardener.execute = function() {
        GrogeGardener.suppressSoilChanges = false;
        GrogeGardener.excludedXYs = new Set();
        switch (GrogeGardener.config.mode) {
            case GrogeGardener.mutateMode:
                GrogeGardener.executeMutateMode();
                break;
            case GrogeGardener.cookieDropMode:
                GrogeGardener.executeCookieDropMode();
                break;
            case GrogeGardener.goldenCookieMode:
                GrogeGardener.executeGoldenCookieMode();
                break;
        }
    };

    GrogeGardener.executeMutateMode = function() {
        const minigame = GrogeGardener.minigame();
        if (GrogeGardener.config.autoConvert) {
            minigame.convert();
        }

        GrogeGardener.harvestLockedNearDeath();
        GrogeGardener.preventContamination();
        GrogeGardener.removeDuplicateLockedGrowing();

        const targetId = GrogeGardener.getTargetPlantId();
        if (targetId === null) {
            if (minigame.plantsUnlockedN == minigame.plantsN) {
                GrogeGardener.updateStatus('Cannot attempt to mutate anything, all plants unlocked');
            } else {
                GrogeGardener.updateStatus('Cannot attempt to mutate anything right now, awaiting further growth');
            }
            return;
        }
        GrogeGardener.updateStatus('Attempting to mutate: ' + minigame.plantsById[targetId].name);

        if (targetId == minigame.plants.meddleweed.id) {
            GrogeGardener.executeMutateForMeddleweed();
        }

        // FIXME
    };

    // Avoid accidentally
    GrogeGardener.harvestLockedNearDeath = function() {
        const minigame = GrogeGardener.minigame();
        for (const [x, y] of GrogeGardener.getXYs()) {
            let plantId = minigame.plot[y][x][0] - 1;
            let age = minigame.plot[y][x][1];
            if (plantId !== -1 && !minigame.plantsById[plantId].unlocked &&
                GrogeGardener.isNearDeath(plantId, age)) {
                minigame.harvest(x, y);
            }
        }
    };

    // Any plants which are locked and growing should be protected from contamination
    GrogeGardener.preventContamination = function() {
        const minigame = GrogeGardener.minigame();
        const [minX, minY, lastX, lastY] =
            minigame.plotLimits[Math.min(minigame.parent.level, 9) - 1];
        for (const [x, y] of GrogeGardener.getXYs()) {
            let plantId = minigame.plot[y][x][0] - 1;
            if (plantId !== -1 && !minigame.plantsById[plantId].unlocked &&
                !minigame.plantsById[plantId].noContam) {
                let deltas = [];
                if (x > minX)      { deltas.push([x - 1, y]); }
                if (x < lastX - 1) { deltas.push([x + 1, y]); }
                if (y > minY)      { deltas.push([x, y - 1]); }
                if (y < lastY - 1) { deltas.push([x, y + 1]); }
                for (const [x2, y2] of deltas) {
                    plantId2 = minigame.plot[y2][x2][0] - 1;
                    if (plantId2 !== -1 && plantId !== plantId2 &&
                        minigame.plantsById[plantId2].contam) {
                        minigame.harvest(x2, y2);
                    }
                }
            }
        }
    };

    // We only need a single copy to unlock the seed, all others just take up space
    GrogeGardener.removeDuplicateLockedGrowing = function() {
        const minigame = GrogeGardener.minigame();
        let best = new Map();
        for (const [x, y] of GrogeGardener.getXYs()) {
            let plantId = minigame.plot[y][x][0] - 1;
            let age = minigame.plot[y][x][1];
            if (plantId !== -1 && !minigame.plantsById[plantId].unlocked) {
                if (!best.has(plantId) || age > best.get(plantId)[0]) {
                    best.set(plantId, [age, x, y]);
                }
            }
        }

        for (const [x, y] of GrogeGardener.getXYs()) {
            let plantId = minigame.plot[y][x][0] - 1;
            if (plantId !== -1 && !minigame.plantsById[plantId].unlocked) {
                const [age, x2, y2] = best.get(plantId);
                if (x !== x2 || y !== y2) {
                    minigame.harvest(x, y);
                }
            }
        }
    };

    GrogeGardener.getTargetPlantId = function() {
        const minigame = GrogeGardener.minigame();
        for (const plantId of GrogeGardener.plantUnlockOrder()) {
            if (minigame.plantsById[plantId].unlocked) {
                continue;
            }
            let isGrowing = false;
            for (const [x, y] of GrogeGardener.getXYs()) {
                if (plantId === (minigame.plot[y][x][0] - 1)) {
                    isGrowing = true;
                }
            }
            if (!isGrowing) {
                return plantId;
            }
        }
        return null;
    };

    GrogeGardener.executeMutateForMeddleweed = function() {
        const minigame = GrogeGardener.minigame();
        GrogeGardener.changeSoil(minigame.soils.fertilizer.id);

        // Clear any plants that aren't locked to maximize the chances of meddleweed spawning
        for (const [x, y] of GrogeGardener.getXYs()) {
            const plantId = minigame.plot[y][x][0] - 1;
            if (plantId !== -1 && minigame.plantsById[plantId].unlocked) {
                minigame.harvest(x, y);
            }
        }
    };

    GrogeGardener.executeCookieDropMode = function() {
        const minigame = GrogeGardener.minigame();

        let targetId = null;
        for (const plantId of GrogeGardener.cookieDropOrder()) {
            if (GrogeGardener.needsCookieDrop(plantId)) {
                targetId = plantId;
                break;
            }
        }

        if (targetId === null) {
            GrogeGardener.updateStatus('Cannot attempt any cookie drops');
            return;
        }
        GrogeGardener.updateStatus('Attempting to drop: ' +
            Game.UpgradesById[GrogeGardener.cookieDropUpgrades().get(targetId)].name + ' (' +
            minigame.plantsById[targetId].name + ')');

        // Others may already be excluded, e.g. in auto mode if we are using the plot for mutation
        // but these should always be excluded even if the user mixes up the mode
        GrogeGardener.excludeLockedMaturingPlants();

        GrogeGardener.changeSoil(minigame.soils.fertilizer.id);
        GrogeGardener.changeDragonAuras(
            GrogeGardener.supremeIntellectAura, GrogeGardener.realityBendingAura);

        if (targetId === minigame.plants.ichorpuff.id) {
            GrogeGardener.executeCookieDropModeForIchorpuffs();
        } else {
            GrogeGardener.executeCookieDropModeNormal(targetId);
        }
    };

    GrogeGardener.executeCookieDropModeNormal = function(targetId) {
        const minigame = GrogeGardener.minigame();

        for (const [x, y] of GrogeGardener.getXYs()) {
            let plantId = minigame.plot[y][x][0] - 1;
            let age = minigame.plot[y][x][1];
            if (plantId === -1) {
                GrogeGardener.plantSeed(targetId, x, y);
            } else if (!minigame.plantsById[plantId].unlocked) {
                // Ignore it and let it grow, in case we switched modes
            } else if (plantId !== targetId && !GrogeGardener.needsCookieDrop(plantId)) {
                // Leftover from something else
                minigame.harvest(x, y);
                GrogeGardener.plantSeed(targetId, x, y);
            } else if (age >= minigame.plantsById[plantId].mature) {
                GrogeGardener.changeDragonAuras(
                    GrogeGardener.mindOverMatterAura, GrogeGardener.realityBendingAura);
                minigame.harvest(x, y);
                GrogeGardener.plantSeed(targetId, x, y);
            } else {
                // Not mature yet, just wait
            }
        }

        GrogeGardener.changeDragonAuras(
            GrogeGardener.supremeIntellectAura, GrogeGardener.realityBendingAura);
    };

    // If Ichorpuff are planted next to each other, they slow each other's growth down, so special
    // case the handling. We can also time the rounds with keenmoss growing to maximize the chance.
    GrogeGardener.executeCookieDropModeForIchorpuffs = function() {
        const minigame = GrogeGardener.minigame();
        const keenmoss = minigame.plants.keenmoss;
        const ichorpuff = minigame.plants.ichorpuff;

        // When there are odd numbers of rows or columns, prefer those
        let evenXY = minigame.parent.level < 6;

        for (const [x, y] of GrogeGardener.getXYs()) {
            let plantId = minigame.plot[y][x][0] - 1;
            let age = minigame.plot[y][x][1];

            const targetIchorpuff = (evenXY === (x % 2 === 0) && evenXY === (y % 2 === 0));
            const targetId = targetIchorpuff ? ichorpuff.id : keenmoss.id;
            if (plantId === -1) {
                GrogeGardener.plantSeed(targetId, x, y);
            } else if (!minigame.plantsById[plantId].unlocked) {
                // Ignore it and let it grow, in case we switched modes
            } else if (GrogeGardener.needsCookieDrop(plantId) &&
                age >= minigame.plantsById[plantId].mature) {
                GrogeGardener.changeDragonAuras(
                    GrogeGardener.mindOverMatterAura, GrogeGardener.realityBendingAura);
                minigame.harvest(x, y);
                GrogeGardener.plantSeed(targetId, x, y);
            } else if (plantId !== targetId && !GrogeGardener.needsCookieDrop(plantId)) {
                // Leftover from something else
                minigame.harvest(x, y);
                GrogeGardener.plantSeed(targetId, x, y);
            } else {
                // Not mature yet, just wait
            }
        }

        GrogeGardener.changeDragonAuras(
            GrogeGardener.supremeIntellectAura, GrogeGardener.realityBendingAura);
    };

    GrogeGardener.executeGoldenCookieMode = function() {
        // FIXME
    };

    GrogeGardener.changeSoil = function(soilId) {
        if (!GrogeGardener.config.controlSoil) {
            return;
        } else if (GrogeGardener.suppressSoilChanges) {
            return;
        }
        // When on auto mode, the first change takes priority so suppress future changes on this
        // execution
        GrogeGardener.suppressSoilChanges = true;

        const minigame = GrogeGardener.minigame();
        if (minigame.soil === soilId) {
            return;
        }

        const button = document.getElementById('gardenSoil-' + soilId);
        if (button) {
            button.click();
        }

        GrogeGardener.scheduleSoilChangeTimeoutIfNeeded();
    };

    GrogeGardener.getRawXYs = function() {
        const minigame = GrogeGardener.minigame();
        const [firstX, firstY, lastX, lastY] =
            minigame.plotLimits[Math.min(minigame.parent.level, 9) - 1];
        let ret = [];
        for (let y = firstY; y != lastY; y++) {
            for (let x = firstX; x != lastX; x++) {
                ret.push([x, y]);
            }
        }
        return ret;
    };

    GrogeGardener.getXYs = function() {
        return GrogeGardener.getRawXYs().filter(xy => !GrogeGardener.excludedXYs.has(xy));
    };

    GrogeGardener.excludeLockedMaturingPlants = function() {
        const minigame = GrogeGardener.minigame();
        for (const [x, y] of GrogeGardener.getXYs()) {
            let plantId = minigame.plot[y][x][0] - 1;
            if (plantId === -1) {
                continue;
            }
            if (!minigame.plantsById[plantId].unlocked) {
                GrogeGardener.excludedXYs.add([x, y]);
            }
        }
    };

    GrogeGardener.changeDragonAuras = function(auraName1, auraName2) {
        let success = GrogeGardener.changeDragonAuraBySlot(auraName1, 0);
        // If the desired aura hasn't been unlocked, slot the desired second aura as the first
        let slotId2 = success ? 1 : 0;
        GrogeGardener.changeDragonAuraBySlot(auraName2, slotId2);
    };

    GrogeGardener.changeDragonAuraBySlot = function(auraName, slotId)  {
        if (!GrogeGardener.config.controlDragonAuras) {
            return false;
        } else if (slotId !== 0 && slotId !== 1) {
            return false;
        } else if (slotId === 1 && Game.dragonLevel < 27) {
            // Second slot not unlocked yet
            return false;
        } else if (!Game.dragonAurasBN.hasOwnProperty(auraName)) {
            // Typo
            Game.Notify(GrogeGardener.name, 'BUG: aura name "' + auraName + '" misconfigured', 1, 1);
            return false;
        }
        const auraId = Game.dragonAurasBN[auraName].id;
        if (Game.dragonLevel < auraId + 4) {
            // Aura not unlocked
            return false;
        }
        const slotName = slotId === 0 ? 'dragonAura' : 'dragonAura2';
        if (Game[slotName] === auraId) {
            // Already set to correct aura
            return true;
        }

        Game[slotName] = auraId;

        // Find the largest building to sacrifice (as normal)
        for (let i = Game.ObjectsById.length - 1; i >= 0; i--) {
            if (Game.ObjectsById[i].amount > 0) {
                Game.ObjectsById[i].sacrifice(1);
                if (GrogeGardener.config.rebuyAfterDragonAura) {
                    Game.ObjectsById[i].buy(1);
                }
                break;
            }
        }
        return true;
    };

    GrogeGardener.isNearDeath = function(plantId, age) {
        const minigame = GrogeGardener.minigame();
        let plant = minigame.plantsById[plantId];
        return !plant.immortal && age + plant.ageTick + plant.ageTickR >= 100;
    };

    GrogeGardener.plantSeed = function(plantId, x, y) {
        if (GrogeGardener.isBuffBlockingPlanting()) {
            GrogeGardener.scheduleBuffExpiredTimeout();
            return false;
        }
        const minigame = GrogeGardener.minigame();
        if (minigame.plot[y][x][0] !== 0) {
            return false;
        }
        if (!minigame.plantsById[plantId].unlocked) {
            return false;
        }
        if (!minigame.plantsById[plantId].plantable) {
            return false;
        }
        return minigame.useTool(plantId, x, y);
    };

    GrogeGardener.isBuffBlockingPlanting = function() {
        if (!GrogeGardener.config.avoidPlantingDuringBuffs) {
            return false;
        }
        let multiplier = 1.0;
        for (const buff in Object.values(Game.buffs)) {
            if (typeof buff.multCpS !== 'undefined' && buff.name.toLowerCase().slice(0, 4) !== 'loan') {
                multiplier = multiplier * buff.multCpS;
            }
        }
        return multiplier > 1.0 && multiplier > GrogeGardener.config.maxBuffToPlant;
    };

    GrogeGardener.scheduleBuffExpiredTimeout = function() {
        if (!GrogeGardener.buffExpiredTimeout) {
            const minTimeTicks = Math.min(...Game.buffs.values().map(buff => buff.time));
            GrogeGardener.buffExpiredTimeout =
                setTimeout(GrogeGardener.handleBuffExpiredTimeout, minTimeTicks * 1000 / 30);
        }
    };

    GrogeGardener.handleBuffExpiredTimeout = function() {
        GrogeGardener.buffExpiredTimeout = null;
        if (GrogeGardener.isBuffBlockingPlanting()) {
            GrogeGardener.scheduleBuffExpiredTimeout();
        } else {
            GrogeGardener.execute();
        }
    };

    GrogeGardener.scheduleSoilChangeTimeoutIfNeeded = function() {
        // We may have just changed soils immediately before the soil change timeout expires, so
        // always reschedule it if needed
        if (GrogeGardener.soilChangeTimeout) {
            clearTimeout(GrogeGardener.soilChangeTimeout);
            GrogeGardener.soilChangeTimeout = null;
        }
        const minigame = GrogeGardener.minigame();
        const now = Date.now();
        if (now < minigame.nextSoil) {
            GrogeGardener.soilChangeTimeout =
                setTimeout(GrogeGardener.handleSoilChangeTimeout, minigame.nextSoil - now);
        }
    };

    GrogeGardener.handleSoilChangeTimeout = function() {
        GrogeGardener.soilChangeTimeout = null;
        GrogeGardener.scheduleSoilChangeTimeoutIfNeeded();

        GrogeGardener.execute();
    };

    GrogeGardener.scheduleAfterTickTimeout = function() {
        if (GrogeGardener.afterTickTimeout) {
            Game.Notify(GrogeGardener.name, 'BUG: attempted to schedule multiple after tick timeouts');
        }

        if (!GrogeGardener.afterTickTimeout) {
            GrogeGardener.afterTickTimeout = setTimeout(GrogeGardener.handleAfterTickTimeout,
                GrogeGardener.minigame().nextStep - Date.now());
        }
    };

    GrogeGardener.handleAfterTickTimeout = function() {
        GrogeGardener.afterTickTimeout = null;
        GrogeGardener.scheduleAfterTickTimeout();

        GrogeGardener.execute();
    };


    GrogeGardener.resetTimers = function() {
        if (GrogeGardener.buffExpiredTimeout) {
            clearTimeout(GrogeGardener.buffExpiredTimeout);
            GrogeGardener.buffExpiredTimeout = null;
        }
        if (GrogeGardener.soilChangeTimeout) {
            clearTimeout(GrogeGardener.soilChangeTimeout);
            GrogeGardener.soilChangeTimeout = null;
        }
        if (GrogeGardener.afterTickTimeout) {
            clearTimeout(GrogeGardener.afterTickTimeout);
            GrogeGardener.afterTickTimeout = null;
        }

        if (GrogeGardener.config.running) {
            if (GrogeGardener.isBuffBlockingPlanting()) {
                GrogeGardener.scheduleBuffExpiredTimeout();
            }
            GrogeGardener.scheduleSoilChangeTimeoutIfNeeded();
            GrogeGardener.scheduleAfterTickTimeout();

            GrogeGardener.execute(); // Execute once on startup/config change
        }
    };

    GrogeGardener.getMenuString = function() {
        let listingDiv = function(innerHtml, labelText, enabled) {
            let className = 'listing';
            if (!enabled) {
                className += ' disable';
            }
            let str = '<div class="' + className + '">';
            str += innerHtml;
            if (labelText !== '') {
                str += '<label>' + labelText + '</label>';
            }
            str += '</div>';
            return str;
        };

        let modeOption = function(modeVal, modeDesc) {
            let str = '<option value="';
            str += modeVal;
            str += '"';
            if (GrogeGardener.config.mode === modeVal) {
                str += ' selected';
            }
            str += '>';
            str += modeDesc;
            str += '</option>';
            return str;
        };

        let str = '';

        str += listingDiv(
            CCSE.MenuHelper.ToggleButton(GrogeGardener.config, 'running',
                'GrogeGardener_option_running',
                'Running: ON', 'Running: OFF', 'GrogeGardener.toggleOption'),
            '(quick toggle all functionality)', true);
        str += listingDiv(
            '<select id="GrogeGardener_option_mode" onchange="GrogeGardener.modeMenuChanged(this.value)">' +
            modeOption(GrogeGardener.mutateMode, 'Mutation Mode') +
            modeOption(GrogeGardener.cookieDropMode, 'Random Cookie Drop Mode') +
            modeOption(GrogeGardener.goldenCookieMode, 'Golden Cookie Mode') +
            '</select>',
            '(select the mode)',
            GrogeGardener.config.running);
        str += listingDiv(
            CCSE.MenuHelper.ToggleButton(GrogeGardener.config, 'controlSoil',
                'GrogeGardener_option_controlSoil',
                'Control Soil: YES', 'Control Soil: NO', 'GrogeGardener.toggleOption'),
            '(Automatically update the soil when desirable)', GrogeGardener.config.running);
        str += listingDiv(
            CCSE.MenuHelper.ToggleButton(GrogeGardener.config, 'controlDragonAuras',
                'GrogeGardener_option_controlDragonAuras',
                'Control Dragon Auras: YES', 'Control Dragon Auras: NO',
                'GrogeGardener.toggleOption'),
            '(Automatically update the dragon auras when desirable)',
            GrogeGardener.config.running);
        str += listingDiv(
            CCSE.MenuHelper.ToggleButton(GrogeGardener.config, 'rebuyAfterDragonAura',
                'GrogeGardener_option_rebuyAfterDragonAura',
                'Rebuy After Dragon Aura Changes: YES', 'Rebuy After Dragon Aura Changes: NO',
                'GrogeGardener.toggleOption'),
            '(Automatically rebuy the highest level building after changing dragon auras)',
            GrogeGardener.config.running && GrogeGardener.config.controlDragonAuras);
        str += listingDiv(
            CCSE.MenuHelper.ToggleButton(GrogeGardener.config, 'autoConvert',
                'GrogeGardener_option_autoConvert',
                'Auto Convert: YES', 'Auto Convert: NO',
                'GrogeGardener.toggleOption'),
            '(Automatically convert the garden for sugar lumps when all seeds are unlocked)',
            GrogeGardener.config.running &&
            GrogeGardener.config.mode === GrogeGardener.mutateMode);
        str += listingDiv(
            CCSE.MenuHelper.ToggleButton(GrogeGardener.config, 'avoidPlantingDuringBuffs',
                'GrogeGardener_option_avoidPlantingDuringBuffs',
                'Plant During Buffs: CONDITIONAL', 'Plant During Buffs: ALWAYS',
                'GrogeGardener.toggleOption'),
            '(Plant even when a CpS buff is active, if conditional, depends on the value of the maximum buff to plant)',
            GrogeGardener.config.running);
        str += listingDiv(
            'Maximum CpS buff to plant: ' +
            CCSE.MenuHelper.InputBox(
                'GrogeGardener_option_maxBuffToPlant',
                100,
                GrogeGardener.config.maxBuffToPlant,
                'GrogeGardener.updateMaxBuffToPlant(this.value)'),
            '(Maximum CpS multiplier to plant during, e.g. "7" to allow during frenzy only)',
            GrogeGardener.config.running && GrogeGardener.config.avoidPlantingDuringBuffs);

        return str;
    };

    GrogeGardener.toggleOption = function(prefName, button, on, off, invert) {
        GrogeGardener.config[prefName] = !GrogeGardener.config[prefName];
        Game.UpdateMenu();

        GrogeGardener.resetTimers();
    };

    GrogeGardener.modeMenuChanged = function(value) {
        GrogeGardener.config.mode = value;
        Game.UpdateMenu();

        GrogeGardener.resetTimers();
    };

    GrogeGardener.updateMaxBuffToPlant = function(value) {
        GrogeGardener.config.maxBuffToPlant = parseInt(value);
        Game.UpdateMenu();

        GrogeGardener.resetTimers();
    };

    Game.registerMod('GrogeGardener', GrogeGardener);
};

if (!GrogeGardener.isLoaded) {
    if (CCSE && CCSE.isLoaded) {
        GrogeGardener.launch();
    } else {
        if (!CCSE) var CCSE = {};
        if (!CCSE.postLoadHooks) CCSE.postLoadHooks = [];
        CCSE.postLoadHooks.push(GrogeGardener.launch);
    }
}
