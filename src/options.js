/*
 *  Cookie Quick Manager: An addon to manage (view, search, create, edit,
 *  remove, backup, restore) cookies on Firefox.
 *  Copyright (C) 2017-2018 Ysard
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 *  Home: https://github.com/ysard/cookie-quick-manager
 */
// IIFE - Immediately Invoked Function Expression
(function(mycode) {

    // The global jQuery object is passed as a parameter
    mycode(window.jQuery, window.vAPI, window, document);

}(function($, vAPI, window, document) {

    // The $ is now locally scoped
    $(function () {
        /*********** Events attached to UI elements ***********/
        $('#import_protected_cookies').change(function() {
            // Import cookies as protected cookies
            set_option({'import_protected_cookies': $(this).is(':checked')});
        });
        $('#delete_all_on_restart').change(function() {
            // Delete all cookies when the browser restarts
            set_option({'delete_all_on_restart': $(this).is(':checked')});
        });
        $('#fpi_status').change(function() {
            // Set the FPI option
            vAPI.getFirstPartyIsolateStatus($(this).is(':checked'));
        });
        $('#skin').change(function() {
            // Change skin
            set_option({'skin': $(this).val()});
        });
        $('#open_in_new_tab').change(function() {
            // Delete all cookies when the browser restarts
            set_option({'open_in_new_tab': $(this).is(':checked')});
        });
        $('#template').change(function() {
            // Change template
            set_option({'template': $(this).val()});
        });
        $('#resetUserDataButton').click(function() {
            // Reset all data
            browser.storage.local.clear();
            // Update the interface
            get_options();
        });
        $('#backupUserDataButton').click(function() {
            // Get all storage data
            let get_settings = browser.storage.local.get();
            get_settings.then((items) => {
                // Download the json file
                download({
                    'url': 'data:text/plain,' + encodeURIComponent(JSON.stringify(items, null, 2)),
                    'filename': 'userdata_cookie_quick_manager.json'
                });
            });
        });
        $("#restoreUserDataButton").click(function(event) {
            // Overlay for <input type=file>
            var restoreFilePicker = document.getElementById("restoreFilePicker");
            if (restoreFilePicker) {
                restoreFilePicker.click();
            }
            event.preventDefault(); // prevent navigation to "#"
        });
        $('#restoreFilePicker').change(function(event) {
            // File load onto the browser
            var file = event.target.files[0];
            if (!file)
                return;

            var reader = new FileReader();
            reader.onload = function(event) {
                // Restore content
                //console.log(JSON.parse(event.target.result));
                set_option(JSON.parse(event.target.result));
                // Update the interface
                get_options();
            };
            reader.readAsText(file);
        });
        $("#show_delete_all_on_restart").click(function(event) {
            $('#delete_all_on_restart_info').toggle();
        });
        $("#show_fpi").click(function(event) {
            $('#fpi_info').toggle();
        });

        // Load options from storage and update the interface
        get_options();
        display_features_depending_on_browser_version();
    });

    /*********** Utils ***********/
    function set_option(option_object) {
        console.log({set_option: option_object});
        let set_settings = browser.storage.local.set(option_object);
        set_settings.then(null, (error) => {
            console.log(`set_option_error: ${error}`);
        });
    }

    function get_options() {
        // Load options from storage and update the interface
        let get_settings = browser.storage.local.get({
            delete_all_on_restart: false,
            import_protected_cookies: false,
            skin: 'default',
            open_in_new_tab: false,
            template: 'JSON',
        });
        get_settings.then((items) => {
            console.log({storage_data: items});

            // Update the interface
            $('#delete_all_on_restart').prop('checked', items.delete_all_on_restart);
            $('#import_protected_cookies').prop('checked', items.import_protected_cookies);
            $('#skin').val(items.skin);
            $('#open_in_new_tab').prop('checked', items.open_in_new_tab);
            $('#template').val(items.template);
        });
    }

    function display_features_depending_on_browser_version() {
        // Display features according to the capactities of the browser

        // First-Party Isolation
        vAPI.FPI_detection(browser.runtime.getBrowserInfo()).then((browser_info) => {
            // Detect Firefox version:
            // -> firstPartyDomain argument is available on Firefox 59+=
            // -> privacy.firstparty.isolate is available on Firefox 58 but we don't want it
            // since we can't handle these cookies on this browser.
            // {name: "Firefox", vendor: "Mozilla", version: "60.0.1", buildID: ""}
            let version = browser_info.version.split('.')[0];

            if ((vAPI.FPI === undefined) || (parseInt(version) < 59)) {
                // Firefox 58-=
                // FPI is not available or we don't want it
                $('#fpi_status').prop('disabled', true);
            } else {
                // Display FPI status
                $('#fpi_status').prop('checked', vAPI.FPI);
            }
        });
    }

    function download(details) {
        // Download a file that contains the given details
        if ( !details.url ) {
            return;
        }

        var a = document.createElement('a');
        a.href = details.url;
        a.setAttribute('download', details.filename || '');
        a.dispatchEvent(new MouseEvent('click'));
    };

    /*********** Global variables ***********/

}));