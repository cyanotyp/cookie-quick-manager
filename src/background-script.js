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
/*********** Update patchs ***********/

function update_listener(details) {
    /* Fired when the extension is first installed, when the extension is updated
     * to a new version, and when the browser is updated to a new version.
     */
    console.log({update_addon: details});
}

browser.runtime.onInstalled.addListener(update_listener);


/*********** Utils ***********/
//var protected_cookies_counter = 0;
var protected_cookies;

function onError(error) {
    // Function called when a save/remove function has failed by throwing an exception.
    console.log({"Error removing/saving cookie:": error});
}

function init_options() {
    // Get & set options from storage
    // Init protected_cookies array in global context
    // Delete cookies (on restart) if the user has selected the option
    // This function is called on each startup and when the addon is installed to the browser

    let get_settings = browser.storage.local.get({
        protected_cookies: {},
        delete_all_on_restart: false,
    });
    get_settings.then((items) => {
        console.log({storage_data: items});

        // protected_cookies array
        // The array check is a workaround to fix previous bug e4e735f (an array instead of an object)
        if (Array.isArray(items.protected_cookies))
            items.protected_cookies = {};

        // Program the deletion of all cookies (except for those which are protected)
        // BUG ?: We must set a delay on this function. Otherwise the API returns 0 cookie...
        if (items.delete_all_on_restart)
            setTimeout(function() {
                vAPI.get_stores().then((stores) => {
                    let deletion_promise = vAPI.delete_cookies(vAPI.get_all_cookies());
                    deletion_promise.then(null, vAPI.onError);
                });
            }, 2000);

        // Init data structure
        // TODO: write only if necessary
        let set_settings = browser.storage.local.set(items);
        set_settings.then(null, onError);
    });
}

/*********** Events ***********/
browser.cookies.onChanged.addListener(function(changeInfo) {
    /* Callback when the cookie store is updated
     * PS: not called when you try to overwrite the exact same cookie.
     *
     * Modification event:
     * Object { removed: true, cookie: Object, cause: "overwrite" }
     * Object { removed: false, cookie: Object, cause: "explicit" }
     *
     * Delete event:
     * Object {removed: true, cookie: Object, cause: "explicit" }
     *
     * Add event:
     * Object {removed: false, cookie: Object, cause: "explicit" }
     *
     * if (changeInfo.removed && changeInfo.cause == "explicit") {
     *     // Reset 2 lists
     *     document.getElementById('domain-list').innerHTML = "";
     *     document.getElementById('cookie-list').innerHTML = "";
     *     // Repop first list
     *     getStores();
     *     // todo update details
     *     // ça vaut peut être pas le coup de réinitialiser les 2 listes tant qu'il y a encore
     *     // des éléments dans la seconde...
     *     // vérifier depuis changeInfo.cookie, le domaine et vérifier si ce domaine a encore des cookies.
     *     // si non, tout rafrachir, si oui on reclique dessus
     * }
     *
     *    if (changeInfo.removed && changeInfo.cause == "overwrite") {
     *        // Simulate click on domain
     *        $('#domain-list').find('li.active').click();
     *
     *    // send directly the id of the cookie overwritten
     *    // {id: domain, storeIds: domains[domain].storeIds}
     *    // Impossible de savoir si d'autres cookies font ref à un autre store
     *    // => obligé de simuler le clic
     *    //var event = {'data': {'id': changeInfo.cookie.domain}};
     *    //showCookiesList(event);
     *    }
     */
    //console.log(changeInfo);

    if (changeInfo.removed && changeInfo.cause == 'explicit') {

        // If the deleted cookie is not in protected_cookies array: do nothing
        if (protected_cookies[changeInfo.cookie.domain] === undefined ||
            protected_cookies[changeInfo.cookie.domain].indexOf(changeInfo.cookie.name) === -1)
            return;

        // Rebuild the cookie given by the event
        let params = {
            url: vAPI.getHostUrl(changeInfo.cookie),
            name: changeInfo.cookie.name,
            value: changeInfo.cookie.value,
            path: changeInfo.cookie.path,
            httpOnly: changeInfo.cookie.httpOnly,
            secure: changeInfo.cookie.secure,
            storeId: changeInfo.cookie.storeId,
        };

        // Handle session cookies (if session there is no expirationDate)
        if (changeInfo.cookie.expirationDate !== undefined)
            params.expirationDate = changeInfo.cookie.expirationDate;

        // Handle FPI flag if present
        if (changeInfo.cookie.firstPartyDomain !== undefined)
            params.firstPartyDomain = changeInfo.cookie.firstPartyDomain;

        let promise = browser.cookies.set(params);
        promise.then((cookie) => {
            console.log({"Erasure protection: Cookie NOT deleted!:": cookie});
            // Increment counter of protected cookies on the toolbar icon
            // TODO: 1 counter per tab ? or add clearer information.. Is this option useful ?
            //protected_cookies_counter++;
            //browser.browserAction.setBadgeText({text: String(protected_cookies_counter)});
        }, onError);
    }
});

browser.storage.onChanged.addListener(function (changes, area) {
    // Called when the local storage area is modified
    // Here: we handle only 'protected_cookies' key.
    // We do that here because we have to know if a cookie must be
    // protected or not from deletion when there is a deletion event.

    //console.log("Change in storage area: " + area);
    //console.log(changes);
    if (changes['protected_cookies'] !== undefined)
        protected_cookies = changes.protected_cookies.newValue;

});

//browser.runtime.onStartup.addListener(init_options);

/*********** Global variables ***********/

init_options();
// Set default color of the counter of protected cookies on the toolbar icon
//browser.browserAction.setBadgeBackgroundColor({color: 'black'});