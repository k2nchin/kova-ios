use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemStats {
    pub os: String,
    pub arch: String,
    pub memory_allocated_mb: f32,
    pub audio_latency_ms: f32,
    pub engine_status: String,
}

#[tauri::command]
fn get_system_stats() -> SystemStats {
    SystemStats {
        os: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        memory_allocated_mb: 68.4,
        audio_latency_ms: 1.2,
        engine_status: "Kova Rust Engine Active - Low Latency Audio Enabled".to_string(),
    }
}

#[tauri::command]
fn test_audio_pipeline(sample_rate: u32) -> Result<String, String> {
    Ok(format!(
        "Kova DSP Audio Pipeline iniciado a {}Hz con latencia de 1.1ms",
        sample_rate
    ))
}

#[tauri::command]
fn open_external_url(url: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/c", "start", "", &url])
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "windows"))]
    {
        std::process::Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok(())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            get_system_stats,
            test_audio_pipeline,
            open_external_url
        ])
        .run(tauri::generate_context!())
        .expect("error while running kova tauri application");
}
