// Function to get the value of a specific URL parameter
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

// Function to set the cookie
function setCookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/"; // path=/ makes it available across the entire site
}

// ----------------------------------------------------
// Main Execution: Check for the parameter and set the cookie
// ----------------------------------------------------

var trafficTypeParam = getUrlParameter('u');

// Check for the unique value you are using for your phone traffic
if (trafficTypeParam === 'pj') {
    // Set a cookie named 'ga_internal_user' to true, expiring in 365 days
    setCookie('ga_internal_user', 'true', 365);
}