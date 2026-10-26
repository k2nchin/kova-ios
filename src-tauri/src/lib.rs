#[cfg(desktop)]
use tauri::Manager;
#[cfg(desktop)]
use tauri::menu::{Menu, MenuItem};
#[cfg(desktop)]
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
#[cfg(desktop)]
use base64::Engine;
#[cfg(desktop)]
use tauri_plugin_window_state::AppHandleExt as _;
use tauri_plugin_opener::OpenerExt;

#[cfg(desktop)]
static CLOSE_TO_TRAY: std::sync::atomic::AtomicBool = std::sync::atomic::AtomicBool::new(true);

#[cfg(desktop)]
#[tauri::command]
fn set_close_to_tray(enabled: bool) {
    CLOSE_TO_TRAY.store(enabled, std::sync::atomic::Ordering::Relaxed);
}

#[tauri::command]
fn open_external_url(app: tauri::AppHandle, url: String) -> Result<(), String> {
    let parsed = url::Url::parse(&url).map_err(|_| "URL externa no válida".to_string())?;
    if !matches!(parsed.scheme(), "https" | "http") {
        return Err("Kova solo permite abrir enlaces HTTP o HTTPS".to_string());
    }

    app.opener()
        .open_url(url, None::<&str>)
        .map_err(|e| e.to_string())
}

#[cfg(desktop)]
#[tauri::command]
fn capture_primary_screen_frame() -> Result<String, String> {
    let monitors = xcap::Monitor::all().map_err(|error| error.to_string())?;
    let monitor = monitors
        .iter()
        .find(|monitor| monitor.is_primary().unwrap_or(false))
        .or_else(|| monitors.first())
        .ok_or_else(|| "No se encontró una pantalla disponible".to_string())?;
    let frame = monitor.capture_image().map_err(|error| error.to_string())?;
    let width = frame.width();
    let height = frame.height();
    let rgb = image::DynamicImage::ImageRgba8(frame).to_rgb8();
    let mut jpeg = Vec::new();
    image::codecs::jpeg::JpegEncoder::new_with_quality(&mut jpeg, 72)
        .encode(&rgb, width, height, image::ExtendedColorType::Rgb8)
        .map_err(|error| error.to_string())?;
    Ok(base64::engine::general_purpose::STANDARD.encode(jpeg))
}

/// Something Kova can share: a whole screen or an app window.
#[cfg(desktop)]
#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct CaptureSource {
    id: String,
    kind: &'static str,
    name: String,
    app_name: String,
    thumbnail: String,
}

#[cfg(desktop)]
fn encode_jpeg(frame: image::RgbaImage, max_width: u32, quality: u8) -> Result<Vec<u8>, String> {
    let mut image = image::DynamicImage::ImageRgba8(frame);
    if image.width() > max_width {
        let height = (image.height() as f64 * max_width as f64 / image.width() as f64).round() as u32;
        image = image.resize_exact(max_width, height.max(1), image::imageops::FilterType::Triangle);
    }
    let rgb = image.to_rgb8();
    let mut jpeg = Vec::new();
    image::codecs::jpeg::JpegEncoder::new_with_quality(&mut jpeg, quality)
        .encode(&rgb, rgb.width(), rgb.height(), image::ExtendedColorType::Rgb8)
        .map_err(|error| error.to_string())?;
    Ok(jpeg)
}

#[cfg(desktop)]
fn capture_by_id(id: &str) -> Result<image::RgbaImage, String> {
    if let Some(raw) = id.strip_prefix("screen:") {
        for monitor in xcap::Monitor::all().map_err(|e| e.to_string())? {
            if monitor.id().map(|v| v.to_string()).unwrap_or_default() == raw {
                return monitor.capture_image().map_err(|e| e.to_string());
            }
        }
    } else if let Some(raw) = id.strip_prefix("window:") {
        for window in xcap::Window::all().map_err(|e| e.to_string())? {
            if window.id().map(|v| v.to_string()).unwrap_or_default() == raw {
                return window.capture_image().map_err(|e| e.to_string());
            }
        }
    }
    Err("Esa ventana o pantalla ya no está disponible".to_string())
}

/// Screens and visible app windows with a small preview (Kova's own window excluded).
#[cfg(desktop)]
#[tauri::command]
async fn list_capture_sources() -> Result<Vec<CaptureSource>, String> {
    tauri::async_runtime::spawn_blocking(|| {
        let mut sources = Vec::new();
        let own_pid = std::process::id();
        for (index, monitor) in xcap::Monitor::all().map_err(|e| e.to_string())?.into_iter().enumerate() {
            let Ok(frame) = monitor.capture_image() else { continue };
            let thumbnail = encode_jpeg(frame, 320, 60).map(|jpeg| base64::engine::general_purpose::STANDARD.encode(jpeg)).unwrap_or_default();
            sources.push(CaptureSource {
                id: format!("screen:{}", monitor.id().unwrap_or_default()),
                kind: "screen",
                name: if monitor.is_primary().unwrap_or(false) { "Pantalla principal".to_string() } else { format!("Pantalla {}", index + 1) },
                app_name: String::new(),
                thumbnail,
            });
        }
        for window in xcap::Window::all().map_err(|e| e.to_string())? {
            if window.is_minimized().unwrap_or(true) || window.pid().unwrap_or(0) == own_pid { continue; }
            let title = window.title().unwrap_or_default();
            if title.trim().is_empty() || window.width().unwrap_or(0) < 120 || window.height().unwrap_or(0) < 80 { continue; }
            let Ok(frame) = window.capture_image() else { continue };
            let thumbnail = encode_jpeg(frame, 320, 60).map(|jpeg| base64::engine::general_purpose::STANDARD.encode(jpeg)).unwrap_or_default();
            sources.push(CaptureSource {
                id: format!("window:{}", window.id().unwrap_or_default()),
                kind: "window",
                name: title,
                app_name: window.app_name().unwrap_or_default(),
                thumbnail,
            });
        }
        Ok(sources)
    })
    .await
    .map_err(|e| e.to_string())?
}

/// One JPEG frame of the chosen source (raw bytes, no base64).
#[cfg(desktop)]
#[tauri::command]
async fn capture_source_frame(id: String, max_width: u32, jpeg_quality: Option<u8>) -> Result<tauri::ipc::Response, String> {
    let jpeg = tauri::async_runtime::spawn_blocking(move || {
        let frame = capture_by_id(&id)?;
        encode_jpeg(frame, max_width.clamp(320, 2560), jpeg_quality.unwrap_or(72).clamp(50, 92))
    })
    .await
    .map_err(|e| e.to_string())??;
    Ok(tauri::ipc::Response::new(jpeg))
}

/// Names of running programs (lower-case .exe names), so Kova can show
/// "Jugando a …" automatically. Only names leave this function, nothing else.
#[cfg(desktop)]
#[tauri::command]
async fn running_processes() -> Result<Vec<String>, String> {
    tauri::async_runtime::spawn_blocking(|| {
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            const CREATE_NO_WINDOW: u32 = 0x0800_0000;
            let output = std::process::Command::new("tasklist")
                .args(["/FO", "CSV", "/NH"])
                .creation_flags(CREATE_NO_WINDOW)
                .output()
                .map_err(|e| e.to_string())?;
            let text = String::from_utf8_lossy(&output.stdout);
            let mut names: Vec<String> = text
                .lines()
                .filter_map(|line| line.split(',').next())
                .map(|name| name.trim_matches('"').to_lowercase())
                .filter(|name| !name.is_empty())
                .collect();
            names.sort();
            names.dedup();
            Ok(names)
        }
        #[cfg(not(windows))]
        {
            Ok(Vec::new())
        }
    })
    .await
    .map_err(|e| e.to_string())?
}

/// Camera and microphone are allowed for Kova's own window, so no
/// browser-style "tauri.localhost wants to use…" prompt ever shows.
#[cfg(windows)]
fn allow_media_permissions(window: &tauri::WebviewWindow) {
    use webview2_com::Microsoft::Web::WebView2::Win32::{
        ICoreWebView2PermissionRequestedEventArgs, COREWEBVIEW2_PERMISSION_KIND, COREWEBVIEW2_PERMISSION_KIND_CAMERA,
        COREWEBVIEW2_PERMISSION_KIND_MICROPHONE, COREWEBVIEW2_PERMISSION_STATE_ALLOW,
    };
    use webview2_com::PermissionRequestedEventHandler;
    let _ = window.with_webview(|webview| unsafe {
        let Ok(core) = webview.controller().CoreWebView2() else { return };
        let handler = PermissionRequestedEventHandler::create(Box::new(
            |_, args: Option<ICoreWebView2PermissionRequestedEventArgs>| {
                if let Some(args) = args {
                    let mut kind = COREWEBVIEW2_PERMISSION_KIND::default();
                    args.PermissionKind(&mut kind)?;
                    if kind == COREWEBVIEW2_PERMISSION_KIND_CAMERA || kind == COREWEBVIEW2_PERMISSION_KIND_MICROPHONE {
                        args.SetState(COREWEBVIEW2_PERMISSION_STATE_ALLOW)?;
                    }
                }
                Ok(())
            },
        ));
        let mut token = 0i64;
        let _ = core.add_PermissionRequested(&handler, &mut token);
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_opener::init());

    #[cfg(desktop)]
    let builder = builder
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .on_window_event(|window, event| {
            #[allow(clippy::single_match)]
            match event {
                // Cerrar a la bandeja: Kova sigue activa para notificaciones y voz.
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    if CLOSE_TO_TRAY.load(std::sync::atomic::Ordering::Relaxed) {
                        api.prevent_close();
                        let _ = window.hide();
                    }
                }
                _ => {}
            }
        })
        .setup(|app| {
            #[cfg(windows)]
            if let Some(window) = app.get_webview_window("main") {
                allow_media_permissions(&window);
            }
            let open = MenuItem::with_id(app, "open", "Abrir Kova", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Salir de Kova", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open, &quit])?;

            TrayIconBuilder::with_id("kova-main")
                .icon(app.default_window_icon().cloned().ok_or("icono no disponible")?)
                .tooltip("Kova — Comunicación hecha para sentirse humana")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "open" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => {
                        let _ = app.save_window_state(tauri_plugin_window_state::StateFlags::all());
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;
            Ok(())
        });

    #[cfg(desktop)]
    let builder = builder.invoke_handler(tauri::generate_handler![
        open_external_url,
        capture_primary_screen_frame,
        list_capture_sources,
        capture_source_frame,
        set_close_to_tray,
        running_processes
    ]);

    #[cfg(mobile)]
    let builder = builder.invoke_handler(tauri::generate_handler![
        open_external_url
    ]);

    builder
        .run(tauri::generate_context!())
        .expect("error while running kova tauri application");
}

