if (GrogeClicker === undefined) var GrogeClicker = {};
if (typeof CCSE == 'undefined') Game.LoadMod('https://klattmose.github.io/CookieClicker/CCSE.js');

GrogeClicker.name = "Groge Clicker";
GrogeClicker.version = "1.0";

GrogeClicker.launch = function() {

    GrogeClicker.init = function() {
        GrogeClicker.isLoaded = true;
        GrogeClicker.config = GrogeClicker.defaultConfig();
        GrogeClicker.nextSuppressionId = 1;
        GrogeClicker.clickSuppressions = new Set();
        GrogeClicker.shimmerSuppressions = new Set();
        GrogeClicker.fortuneSuppressions = new Set();

        Game.customStatsMenu.push(function() {
            CCSE.AppendStatsVersionNumber(GrogeClicker.name, GrogeClicker.version);
        });
        Game.customOptionsMenu.push(function() {
            CCSE.AppendCollapsibleOptionsMenu(GrogeClicker.name, GrogeClicker.getMenuString());
        });

        CCSE.customSave.push(function() {
            CCSE.config.OtherMods.GrogeClicker = GrogeClicker.config;
        });
        CCSE.customLoad.push(function() {
            if (CCSE.config.OtherMods.GrogeClicker) {
                GrogeClicker.config = Object.assign(GrogeClicker.defaultConfig(),
                    CCSE.config.OtherMods.GrogeClicker);
            }

            GrogeClicker.updateToggleButton();
            GrogeClicker.resetTimers();
        });

        Game.Notify(GrogeClicker.name, 'Mod loaded', [0, 0], 1, 1);

        GrogeClicker.updateToggleButton();
        GrogeClicker.resetTimers();
    };

    // APIs that other mods can use to temporarily suppress functionality. Suppressions aren't saved
    // across reloads
    GrogeClicker.suppressClicks = function() {
        const id = GrogeClicker.nextSuppressionId++;
        GrogeClicker.clickSuppressions.add(id);
        GrogeClicker.resetTimers();
        return id;
    };
    GrogeClicker.suppressShimmers = function() {
        const id = GrogeClicker.nextSuppressionId++;
        GrogeClicker.shimmerSuppressions.add(id);
        GrogeClicker.resetTimers();
        return id;
    };
    GrogeClicker.suppressFortunes = function() {
        const id = GrogeClicker.nextSuppressionId++;
        GrogeClicker.fortuneSuppressions.add(id);
        GrogeClicker.resetTimers();
        return id;
    };
    GrogeClicker.suppress = function() {
        const id = GrogeClicker.nextSuppressionId++;
        GrogeClicker.clickSuppressions.add(id);
        GrogeClicker.shimmerSuppressions.add(id);
        GrogeClicker.fortuneSuppressions.add(id);
        GrogeClicker.resetTimers();
        return id;
    };
    GrogeClicker.unsuppress = function(id) {
        let valid = false;
        valid = GrogeClicker.clickSuppressions.delete(id) || valid;
        valid = GrogeClicker.shimmerSuppressions.delete(id) || valid;
        valid = GrogeClicker.fortuneSuppressions.delete(id) || valid;
        GrogeClicker.resetTimers();
        return valid;
    };

    GrogeClicker.shimmerCheckDelayMs = 100;
    GrogeClicker.fortuneCheckDelayMs = 1000;
    GrogeClicker.defaultConfig = function() {
        return {
            running: true,
            showToggleButton: true,
            shouldClick: true,
            clickDelayMs: 1,
            shouldClickGolden: true,
            shouldClickSeasonal: true,
            shouldClickWrath: true,
            shouldClickFortune: true,
        };
    };

    GrogeClicker.doClick = function() {
        Game.ClickCookie();
    };

    GrogeClicker.doShimmerCheck = function() {
        if (!Game.shimmers) {
            return;
        }
        for (let i = 0; i < Game.shimmers.length; i++) {
            let shimmer = Game.shimmers[i];
            if (shimmer.type === 'golden') {
                if (shimmer.wrath > 0 && GrogeClicker.config.shouldClickWrath &&
                    !shimmer.forceObj.wrath) {
                    shimmer.pop();
                } else if (shimmer.wrath === 0 && GrogeClicker.config.shouldClickGolden) {
                    shimmer.pop();
                }
            } else if (shimmer.type === 'reindeer' && GrogeClicker.config.shouldClickSeasonal) {
                shimmer.pop();
            }
        }
    };

    GrogeClicker.doFortuneCheck = function() {
        if (Game.tickerL && Game.TickerEffect && Game.TickerEffect.type === 'fortune') {
            Game.tickerL.click();
        }
    };


    GrogeClicker.resetTimers = function() {
        if (GrogeClicker.clickInterval) {
            clearInterval(GrogeClicker.clickInterval);
            GrogeClicker.clickInterval = null;
        }
        if (GrogeClicker.shimmerInterval) {
            clearInterval(GrogeClicker.shimmerInterval);
            GrogeClicker.shimmerInterval = null;
        }
        if (GrogeClicker.fortuneInterval) {
            clearInterval(GrogeClicker.fortuneInterval);
            GrogeClicker.fortuneInterval = null;
        }

        if (GrogeClicker.config.running) {
            if (GrogeClicker.config.shouldClick && GrogeClicker.clickSuppressions.size === 0) {
                GrogeClicker.clickInterval = setInterval(GrogeClicker.doClick,
                    GrogeClicker.config.clickDelayMs);
            }
            if ((GrogeClicker.config.shouldClickGolden ||
                GrogeClicker.config.shouldClickSeasonal ||
                GrogeClicker.config.shouldClickWrath) &&
                GrogeClicker.shimmerSuppressions.size === 0) {
                GrogeClicker.shimmerInterval = setInterval(GrogeClicker.doShimmerCheck,
                    GrogeClicker.shimmerCheckDelayMs);
            }
            if (GrogeClicker.config.shouldClickFortune &&
                GrogeClicker.fortuneSuppressions.size === 0) {
                GrogeClicker.fortuneInterval = setInterval(GrogeClicker.doFortuneCheck,
                    GrogeClicker.fortuneCheckDelayMs);
            }
        }
    };

    GrogeClicker.toggleRunning = function(btn) {
        GrogeClicker.config.running = !GrogeClicker.config.running;
        btn.classList.toggle('enabled', GrogeClicker.config.running);

        Game.UpdateMenu();
        GrogeClicker.resetTimers();
    };

    GrogeClicker.updateToggleButton = function() {
        let wrapper = document.getElementById('GrogeClicker_toggle_wrapper');
        if (wrapper) wrapper.remove();

        if (GrogeClicker.config.showToggleButton) {
            const container = document.getElementById('sectionLeft');
            if (!container) {
                return;
            }

            // Mimics the store container so the .crate:hover styling of the button won't mess with
            // the total position
            wrapper = document.createElement('div');
            wrapper.id = 'GrogeClicker_toggle_wrapper';
            wrapper.style = 'display:block;position:absolute;width:64px;height:64px;right:54px;bottom:24px;z-index:100';

            let button = document.createElement('div');
            button.id = 'GrogeClicker_toggle_button';
            button.onclick = function() { GrogeClicker.toggleRunning(button); };
            button.classList.add('crate', 'upgrade');
            button.classList.toggle('enabled', GrogeClicker.config.running);
            button.style = 'background-position:0px 0px';
            wrapper.appendChild(button);

            container.appendChild(wrapper);
        }
    };

    GrogeClicker.getMenuString = function() {
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

        let str = ''
        str += listingDiv(
            CCSE.MenuHelper.ToggleButton(GrogeClicker.config, 'running', 'GrogeClicker_option_running',
                'Running: ON', 'Running: OFF', 'GrogeClicker.toggleOption'),
            '(quick toggle all functionality)', true);
        str += listingDiv(
            CCSE.MenuHelper.ToggleButton(GrogeClicker.config, 'showToggleButton',
                'GrogeClicker_option_showToggleButton',
                'Toggle Button: ON', 'Toggle Button: OFF', 'GrogeClicker.toggleOption'),
            '(show the toggle button below the big cookie)', true);
        str += listingDiv(
            CCSE.MenuHelper.ToggleButton(GrogeClicker.config, 'shouldClick',
                'GrogeClicker_option_shouldClick',
                'Click: YES', 'Click: NO', 'GrogeClicker.toggleOption'),
            '(whether to click the big cookie)', GrogeClicker.config.running);
        str += listingDiv(
            CCSE.MenuHelper.Slider('GrogeClicker_option_clickDelayMs',
                'Delay between clicks: ', '[$] ms',
                function() { return GrogeClicker.config.clickDelayMs; },
                'GrogeClicker.updateClickDelayMs(this.value)',
                1, 1000, 1),
            '(delay between clicking the big cookie)',
            GrogeClicker.config.running && GrogeClicker.config.shouldClick);
        str += listingDiv(
            CCSE.MenuHelper.ToggleButton(GrogeClicker.config, 'shouldClickGolden',
                'GrogeClicker_option_shouldClickGolden',
                'Click Golden: YES', 'Click Golden: NO', 'GrogeClicker.toggleOption'),
            '(whether to click golden cookies)', GrogeClicker.config.running);
        str += listingDiv(
            CCSE.MenuHelper.ToggleButton(GrogeClicker.config, 'shouldClickSeasonal',
                'GrogeClicker_option_shouldClickSeasonal',
                'Click Seasonal: YES', 'Click Seasonal: NO', 'GrogeClicker.toggleOption'),
            '(whether to click seasonal cookies like reindeer)', GrogeClicker.config.running);
        str += listingDiv(
            CCSE.MenuHelper.ToggleButton(GrogeClicker.config, 'shouldClickWrath',
                'GrogeClicker_option_shouldClickWrath',
                'Click Wrath: YES', 'Click Wrath: NO', 'GrogeClicker.toggleOption'),
            '(whether to click wrath cookies, but backfires from the "force the hand of fate" spell are never clicked)', GrogeClicker.config.running);
        str += listingDiv(
            CCSE.MenuHelper.ToggleButton(GrogeClicker.config, 'shouldClickFortune',
                'GrogeClicker_option_shouldClickFortune',
                'Click Fortune: YES', 'Click Fortune: NO', 'GrogeClicker.toggleOption'),
            '(whether to click fortune news headlines)', GrogeClicker.config.running);
        return str;
    };

    GrogeClicker.toggleOption = function(prefName, button, on, off, invert) {
        GrogeClicker.config[prefName] = !GrogeClicker.config[prefName];
        Game.UpdateMenu();

        if (prefName === 'showToggleButton' || prefName == 'running') {
            GrogeClicker.updateToggleButton();
        }
        GrogeClicker.resetTimers();
    };

    GrogeClicker.updateClickDelayMs = function(value) {
        GrogeClicker.config.clickDelayMs = parseInt(value);

        // Calling Game.UpdateMenu janks the cursor, so do it manually
        const elem = document.getElementById('GrogeClicker_option_clickDelayMsRightText');
        if (elem) {
            elem.textContent = value + ' ms';
        }

        GrogeClicker.resetTimers();
    };

    Game.registerMod('GrogeClicker', GrogeClicker);
};


if (!GrogeClicker.isLoaded) {
    if (CCSE && CCSE.isLoaded) {
        GrogeClicker.launch();
    } else {
        if (!CCSE) var CCSE = {};
        if (!CCSE.postLoadHooks) CCSE.postLoadHooks = [];
        CCSE.postLoadHooks.push(GrogeClicker.launch);
    }
}
