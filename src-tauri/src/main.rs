// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    #[cfg(target_os = "windows")]
    {
        // Enable WebView2 media & screen capturing switches for .exe and portable distribution
        std::env::set_var(
            "WEBVIEW2_ADDITIONAL_BROWSER_ARGS",
            "--enable-usermedia-screen-capturing --allow-http-screen-capture --enable-features=msWebOOUI,msWebView2EnableDraggableRegions --autoplay-policy=no-user-gesture-required",
        );
    }

    app_lib::run();
}
