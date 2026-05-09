// Tauri + Next.js standalone - Version FINALE qui fonctionne
use std::process::Command;
use std::thread;
use std::time::{Duration, Instant};
use tauri::Manager;
use std::net::IpAddr;

fn get_local_ip() -> Option<String> {
    for iface in get_if_addrs::get_if_addrs().unwrap_or_default() {
        if !iface.is_loopback() {
            if let IpAddr::V4(v4) = iface.addr.ip() {
                return Some(v4.to_string());
            }
        }
    }
    None
}

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

      // EN PRODUCTION: Lancer le serveur d'abord, PUIS créer la fenêtre
      #[cfg(not(debug_assertions))]
      {
        let app_dir = app.path().app_data_dir().expect("Erreur");
        let node_path = app_dir.join("resources").join("node.exe");
        let server_dir = app_dir.join("resources").join(".next").join("standalone");

        if !node_path.exists() {
            eprintln!("❌ Erreur: node.exe introuvable: {:?}", node_path);
            return Ok(());
        }

        if !server_dir.exists() {
            eprintln!("❌ Erreur: dossier standalone introuvable: {:?}", server_dir);
            return Ok(());
        }

        // Chercher server.js ou server/index.js
        let mut server_js = server_dir.join("server.js");
        if !server_js.exists() {
            server_js = server_dir.join("server").join("index.js");
        }
        if !server_js.exists() {
            eprintln!("❌ Erreur: server.js introuvable dans {:?}", server_dir);
            return Ok(());
        }

        println!("🚀 Lancement du serveur Next.js...");
        println!("   server_js: {:?}", server_js);
        println!("   server_dir: {:?}", server_dir);

        // Lancer node.exe server.js en arrière-plan
        match Command::new(&node_path)
            .arg(server_js.as_os_str())
            .current_dir(&server_dir)
            .spawn()
        {
            Ok(child) => {
                println!("✅ Serveur Next.js lancé (PID: {:?})", child.id());

                // ⏳️ ATTENDRE que le serveur soit PRÊT (max 30 secondes)
                println!("⏳️ En attente du serveur (max 30s)...");
                let start = Instant::now();
                let mut server_ready = false;

                while start.elapsed() < Duration::from_secs(30) {
                    // Tenter d'accéder au serveur
                    match reqwest::blocking::get("http://localhost:3000") {
                        Ok(resp) => {
                            if resp.status().is_success() {
                                println!("✅ Serveur prêt en {:?}ms", start.elapsed().as_millis());
                                server_ready = true;
                                break;
                            }
                        }
                        Err(_) => {
                            // Serveur pas encore prêt, réessayer dans 500ms
                            thread::sleep(Duration::from_millis(500));
                        }
                    }
                }

                if !server_ready {
                    eprintln!("❌ Le serveur n'a pas démarré dans les temps");
                    return Ok(());
                }

                // ✅ SERVEUR PRÊT → Maintenant on crée la fenêtre !
                println!("🖥 Création de la fenêtre...");
                let ip = get_local_ip().unwrap_or_else(|| "127.0.0.1".to_string());
                let title = format!("Gestionnaire d'Assemblée - {}", ip);

                let handle = app.handle().clone();
                let _window = tauri::WebviewWindowBuilder::new(
                    &handle,
                    "main",
                    tauri::WebviewUrl::External("http://localhost:3000".parse().unwrap())
                )
                .title(&title)
                .inner_size(1200.0, 800.0)
                .resizable(true)
                .build()
                .expect("Erreur: impossible de créer la fenêtre");

                println!("✅ Fenêtre créée et connectée à http://localhost:3000");
                println!("✅ Titre: {}", title);
            }
            Err(e) => {
                eprintln!("❌ Erreur lors du lancement du serveur: {}", e);
                return Ok(());
            }
        }
      }

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![])
    .run(tauri::generate_context!())
    .expect("Erreur lors de l'exécution de l'application Tauri");
}
