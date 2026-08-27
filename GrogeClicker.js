if (GrogeClicker === undefined) var GrogeClicker = {};
if (typeof CCSE == 'undefined') Game.LoadMod('https://klattmose.github.io/CookieClicker/CCSE.js');

GrogeClicker.name = "Groge Clicker";
GrogeClicker.version = "1.0";

GrogeClicker.launch = function() {

    GrogeClicker.init = function() {
        GrogeClicker.isLoaded = true;
        GrogeClicker.config = GrogeClicker.defaultConfig();

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

        Game.Notify(GrogeClicker.name + ' loaded', '', 1, 1);

        GrogeClicker.updateToggleButton();
        GrogeClicker.resetTimers();
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
            shouldClickWrath: false,
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
                if (shimmer.wrath > 0 && GrogeClicker.config.shouldClickWrath) {
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
            if (GrogeClicker.config.shouldClick) {
                GrogeClicker.clickInterval = setInterval(GrogeClicker.doClick,
                    GrogeClicker.config.clickDelayMs);
            }
            if (GrogeClicker.config.shouldClickGolden ||
                GrogeClicker.config.shouldClickSeasonal ||
                GrogeClicker.config.shouldClickWrath) {
                GrogeClicker.shimmerInterval = setInterval(GrogeClicker.doShimmerCheck,
                    GrogeClicker.shimmerCheckDelayMs);
            }
            if (GrogeClicker.config.shouldClickFortune) {
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
        let str = ''

        str += '<div class="listing">' +
            CCSE.MenuHelper.ToggleButton(GrogeClicker.config, 'running', 'GrogeClicker_option_running',
                'Running: ON', 'Running: OFF', 'GrogeClicker.toggleOption') +
            '<label>(quick toggle all functionality)</label></div>';
        str += '<div class="listing">' +
            CCSE.MenuHelper.ToggleButton(GrogeClicker.config, 'showToggleButton',
                'GrogeClicker_option_showToggleButton',
                'Toggle Button: ON', 'Toggle Button: OFF', 'GrogeClicker.toggleOption') +
            '<label>(show the toggle button below the big cookie)</label></div>';
        str += '<div class="listing">' +
            CCSE.MenuHelper.ToggleButton(GrogeClicker.config, 'shouldClick',
                'GrogeClicker_option_shouldClick',
                'Click: YES', 'Click: NO', 'GrogeClicker.toggleOption') +
            '<label>(whether to click the big cookie)</label></div>';

        let clickSliderClass = GrogeClicker.config.shouldClick ? '' : 'disable';
        str += '<div class="listing ' + clickSliderClass + '">' +
            CCSE.MenuHelper.Slider('GrogeClicker_option_clickDelayMs',
                'Delay between clicks: ', '[$] ms',
                function() { return GrogeClicker.config.clickDelayMs; },
                'GrogeClicker.updateClickDelayMs(this.value)',
                1, 1000, 1) +
            '<label>(delay between clicking the big cookie)</label></div>';

        str += '<div class="listing">' +
            CCSE.MenuHelper.ToggleButton(GrogeClicker.config, 'shouldClickGolden',
                'GrogeClicker_option_shouldClickGolden',
                'Click Golden: YES', 'Click Golden: NO', 'GrogeClicker.toggleOption') +
            '<label>(whether to click golden cookies)</label></div>';
        str += '<div class="listing">' +
            CCSE.MenuHelper.ToggleButton(GrogeClicker.config, 'shouldClickSeasonal',
                'GrogeClicker_option_shouldClickSeasonal',
                'Click Seasonal: YES', 'Click Seasonal: NO', 'GrogeClicker.toggleOption') +
            '<label>(whether to click seasonal cookies like reindeer)</label></div>';
        str += '<div class="listing">' +
            CCSE.MenuHelper.ToggleButton(GrogeClicker.config, 'shouldClickWrath',
                'GrogeClicker_option_shouldClickWrath',
                'Click Wrath: YES', 'Click Wrath: NO', 'GrogeClicker.toggleOption') +
            '<label>(whether to click wrath cookies)</label></div>';
        str += '<div class="listing">' +
            CCSE.MenuHelper.ToggleButton(GrogeClicker.config, 'shouldClickFortune',
                'GrogeClicker_option_shouldClickFortune',
                'Click Fortune: YES', 'Click Fortune: NO', 'GrogeClicker.toggleOption') +
            '<label>(whether to click fortune news headlines)</label></div>';
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

    Game.registerMod(GrogeClicker.name, GrogeClicker);
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
