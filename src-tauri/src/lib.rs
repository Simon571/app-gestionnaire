// Plus besoin d'imports pour Node.js runtime
// Tauri sert directement les fichiers statiques depuis out/


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      #[cfg(debug_assertions)]
      {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      // En production, Tauri sert directement les fichiers depuis out/
      // Plus besoin de lancer Node.js
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
