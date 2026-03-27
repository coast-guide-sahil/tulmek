/// TULMEK Desktop — Tauri v2 app wrapping the Next.js web app.
/// Shares 100% of the UI code with the web app via devUrl/frontendDist.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tulmek desktop");
}
