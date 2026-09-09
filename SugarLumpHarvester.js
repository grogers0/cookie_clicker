if (SugarLumpHarvester === undefined) var SugarLumpHarvester = {};
if (typeof CCSE == 'undefined') Game.LoadMod('https://klattmose.github.io/CookieClicker/CCSE.js');
// if (typeof DragonAuras == 'undefined') Game.LoadMod('https://grogers0.github.io/cookie_clicker/DragonAuras.js'); // Optional

SugarLumpHarvester.id = 'SugarLumpHarvester';
SugarLumpHarvester.name = 'Sugar Lump Harvester';
SugarLumpHarvester.version = '1.0';

SugarLumpHarvester.launch = function() {
    SugarLumpHarvester.init = function() {
        SugarLumpHarvester.isLoaded = true;
        SugarLumpHarvester.config = SugarLumpHarvester.defaultConfig();

        Game.customStatsMenu.push(function() {
            CCSE.AppendStatsVersionNumber(SugarLumpHarvester.name, SugarLumpHarvester.version);
        });
        Game.customOptionsMenu.push(function() {
            CCSE.AppendCollapsibleOptionsMenu(SugarLumpHarvester.name, SugarLumpHarvester.getMenuString());
        });

        CCSE.customSave.push(function() {
            CCSE.config.OtherMods.SugarLumpHarvester = SugarLumpHarvester.config;
        });
        CCSE.customLoad.push(function() {
            if (CCSE.config.OtherMods.SugarLumpHarvester) {
                SugarLumpHarvester.config = Object.assign(SugarLumpHarvester.defaultConfig(),
                    CCSE.config.OtherMods.SugarLumpHarvester);
            }

            SugarLumpHarvester.execute();
        });
        Game.customLumpTooltip.push(function(str) {
            const closingDiv = '</div>';
            if (str.endsWith(closingDiv)) {
                str = str.slice(0, -closingDiv.length);
                str += '<div class="line"></div>'
                str += '<b>Sugar Lump Harvester</b> will harvest in ';
                const delaySecs = SugarLumpHarvester.computeMillisToNextHarvest() / 1000;
                str += Game.sayTime((delaySecs + 1) * Game.fps, -1);
                str += closingDiv;
            }
            return str;
        });

        // Attempt every so often in case the dragon is upgraded or some other mod updates lumps
        setInterval(SugarLumpHarvester.execute, 60000);

        SugarLumpHarvester.execute();

        SugarLumpHarvester.notify('Mod loaded', 1, 1);
    };

    SugarLumpHarvester.notify = function(desc, quick, noLog) {
        return Game.Notify(SugarLumpHarvester.name, desc, [28, 14], quick, noLog);
    };

    SugarLumpHarvester.dragonAurasModLoaded = function() {
        return (typeof DragonAuras != 'undefined');
    };

    SugarLumpHarvester.defaultConfig = function() {
        return {
            controlDragonAuras: SugarLumpHarvester.dragonAurasModLoaded(),
            rebuyAfterDragonAura: true,
        };
    };

    SugarLumpHarvester.bestDragonAuras = function() {
        return ['Dragon\'s Curve', 'Reality Bending'];
    };

    SugarLumpHarvester.shouldControlDragonAuras = function() {
        return SugarLumpHarvester.config.controlDragonAuras &&
            SugarLumpHarvester.dragonAurasModLoaded();
    };

    SugarLumpHarvester.shouldControlDragonAurasWithWarning = function() {
        if (!SugarLumpHarvester.config.controlDragonAuras) {
            return false;
        } else if (!SugarLumpHarvester.dragonAurasModLoaded()) {
            SugarLumpHarvester.notify(
                'Warning: Controlling dragon auras enabled, but DragonAuras mod not loaded', 6, 1);
            return false;
        } else {
            return true;
        }
    };

    SugarLumpHarvester.execute = function() {
        if (SugarLumpHarvester.timeout) {
            clearTimeout(SugarLumpHarvester.timeout);
            SugarLumpHarvester.timeout = null;
        }
        if (!Game.canLumps()) {
            return;
        }
        const age = Date.now() - Game.lumpT;
        if (SugarLumpHarvester.shouldControlDragonAurasWithWarning()) {
            const optimalRipeAge = SugarLumpHarvester.computeOptimalRipeAge();
            if (age >= optimalRipeAge) {
                const origAuras = DragonAuras.get();
                const rebuy1 = DragonAuras.update(SugarLumpHarvester.bestDragonAuras());
                Game.computeLumpTimes(); // Immediately instead of waiting a tick for recalculating
                if (age >= Game.lumpRipeAge) {
                    Game.clickLump();
                } else {
                    SugarLumpHarvester.notify(
                        'BUG: Expected sugar lump to be ripe after switching dragon auras', 0, 0);
                }
                const rebuy2 = DragonAuras.update(origAuras);
                if (SugarLumpHarvester.config.rebuyAfterDragonAura) {
                    DragonAuras.rebuy(rebuy2);
                    DragonAuras.rebuy(rebuy1);
                }
            }
        } else if (age >= Game.lumpRipeAge) {
            Game.clickLump();
        }

        SugarLumpHarvester.reschedule();
    };

    SugarLumpHarvester.computeOptimalRipeAge = function() {
        if (SugarLumpHarvester.shouldControlDragonAuras()) {
            return Game.lumpRipeAge *
                (1 + Game.auraMult('Dragon\'s Curve') * 0.05) /
                (1 + DragonAuras.auraMultAfterUpdate(SugarLumpHarvester.bestDragonAuras()) * 0.05);
        } else {
            return Game.lumpRipeAge;
        }
    };

    SugarLumpHarvester.computeMillisToNextHarvest = function() {
        return Math.max(1, Game.lumpT + SugarLumpHarvester.computeOptimalRipeAge() - Date.now());
    };

    // Schedule a precise timer to harvest at the exact right time
    SugarLumpHarvester.reschedule = function() {
        if (SugarLumpHarvester.timeout) {
            clearTimeout(SugarLumpHarvester.timeout);
            SugarLumpHarvester.timeout = null;
        }
        if (Game.canLumps()) {
            SugarLumpHarvester.timeout = setTimeout(SugarLumpHarvester.execute,
                SugarLumpHarvester.computeMillisToNextHarvest());
        }
    };

    SugarLumpHarvester.getMenuString = function() {
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

        let str = '';

        str += listingDiv(
            CCSE.MenuHelper.ToggleButton(SugarLumpHarvester.config, 'controlDragonAuras',
                'SugarLumpHarvester_option_controlDragonAuras',
                'Control Dragon Auras: YES', 'Control Dragon Auras: NO',
                'SugarLumpHarvester.toggleOption'),
            '(Automatically update the dragon auras when desirable)',
            SugarLumpHarvester.dragonAurasModLoaded());
        str += listingDiv(
            CCSE.MenuHelper.ToggleButton(SugarLumpHarvester.config, 'rebuyAfterDragonAura',
                'SugarLumpHarvester_option_rebuyAfterDragonAura',
                'Rebuy After Dragon Aura Changes: YES', 'Rebuy After Dragon Aura Changes: NO',
                'SugarLumpHarvester.toggleOption'),
            '(Automatically rebuy the highest level building after changing dragon auras)',
            SugarLumpHarvester.config.controlDragonAuras);

        return str;
    };

    SugarLumpHarvester.toggleOption = function(prefName, button, on, off, invert) {
        SugarLumpHarvester.config[prefName] = !SugarLumpHarvester.config[prefName];
        Game.UpdateMenu();

        SugarLumpHarvester.execute();
    };

    Game.registerMod(SugarLumpHarvester.id, SugarLumpHarvester);
};

if (!SugarLumpHarvester.isLoaded) {
    if (CCSE && CCSE.isLoaded) {
        SugarLumpHarvester.launch();
    } else {
        if (!CCSE) var CCSE = {};
        if (!CCSE.postLoadHooks) CCSE.postLoadHooks = [];
        CCSE.postLoadHooks.push(SugarLumpHarvester.launch);
    }
}
