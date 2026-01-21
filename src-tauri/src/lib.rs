#[cfg(not(debug_assertions))]
use std::{
  fs,
  fs::File,
  io::{Error, ErrorKind},
  path::{Path, PathBuf},
  process::{Child, Command, Stdio},
  sync::Mutex,
  time::UNIX_EPOCH,
};

#[cfg(not(debug_assertions))]
use flate2::read::GzDecoder;

#[cfg(not(debug_assertions))]
use tar::Archive;

#[cfg(not(debug_assertions))]
use tauri::{path::BaseDirectory, Manager};

#[cfg(not(debug_assertions))]
struct NextServer(Mutex<Option<Child>>);

#[cfg(not(debug_assertions))]
fn extract_tar_gz(archive_path: &Path, destination: &Path) -> Result<(), Box<dyn std::error::Error>> {
  let tar_file = File::open(archive_path)?;
  let decompressor = GzDecoder::new(tar_file);
  let mut archive = Archive::new(decompressor);
  archive.unpack(destination)?;
  Ok(())
}

#[cfg(not(debug_assertions))]
fn prepare_runtime_dir(app: &tauri::AppHandle) -> Result<PathBuf, Box<dyn std::error::Error>> {
  let resolver = app.path();

  let archive_path = resolver
    .resolve("next-dist.tar.gz", BaseDirectory::Resource)?;

  let archive_mtime = archive_path
    .metadata()?
    .modified()?
    .duration_since(UNIX_EPOCH)?
    .as_secs();
  let archive_stamp = archive_mtime.to_string();

  let runtime_dir = resolver
    .resolve("next-runtime", BaseDirectory::AppLocalData)?;

  let marker_file = runtime_dir.join(".archive_mtime");

  let needs_unpack = if runtime_dir.exists() {
    match fs::read_to_string(&marker_file) {
      Ok(content) => content.trim() != archive_stamp,
      Err(_) => true,
    }
  } else {
    true
  };

  if needs_unpack {
    if runtime_dir.exists() {
      fs::remove_dir_all(&runtime_dir)?;
    }
    fs::create_dir_all(&runtime_dir)?;
    extract_tar_gz(&archive_path, &runtime_dir)?;
    fs::write(&marker_file, archive_stamp)?;
  }

  Ok(runtime_dir)
}

#[cfg(not(debug_assertions))]
fn start_next_server(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
  let runtime_dir = prepare_runtime_dir(app)?;

  let server_path = runtime_dir.join("server.js");
  if !server_path.exists() {
    return Err(Box::new(Error::new(
      ErrorKind::NotFound,
      format!("server.js introuvable dans {:?}", runtime_dir),
    )));
  }

  let resolver = app.path();

  let bundled_node_runtime = if cfg!(target_os = "windows") {
    runtime_dir.join("node.exe")
  } else {
    runtime_dir.join("node")
  };

  let bundled_node_resource = if cfg!(target_os = "windows") {
    resolver.resolve("node/node.exe", BaseDirectory::Resource).ok()
  } else {
    resolver.resolve("node/node", BaseDirectory::Resource).ok()
  };

  let node_binary: PathBuf = if bundled_node_runtime.exists() {
    bundled_node_runtime
  } else if let Some(path) = bundled_node_resource.filter(|p| p.exists()) {
    path
  } else if cfg!(target_os = "windows") {
    PathBuf::from("node.exe")
  } else {
    PathBuf::from("node")
  };

  let mut command = Command::new(&node_binary);
  command
    .current_dir(&runtime_dir)
    .arg(&server_path)
    .env("PORT", "1420")
    .env("HOSTNAME", "127.0.0.1")
    .env("NEXT_RUNTIME", "nodejs")
    .env("NODE_ENV", "production")
    .stdin(Stdio::null())
    .stdout(Stdio::null())
    .stderr(Stdio::null());

  let child = command.spawn().map_err(|err| {
    Error::new(
      ErrorKind::Other,
      format!("Impossible de lancer le serveur Next.js avec {:?}: {}", node_binary, err),
    )
  })?;

  app.manage(NextServer(Mutex::new(Some(child))));
  Ok(())
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
      #[cfg(not(debug_assertions))]
      {
        start_next_server(&app.handle())?;
      }
      Ok(())
    })
    .on_window_event(|window, event| {
      #[cfg(not(debug_assertions))]
      {
        if matches!(event, tauri::WindowEvent::CloseRequested { .. }) {
          if let Some(state) = window.app_handle().try_state::<NextServer>() {
            if let Ok(mut guard) = state.0.lock() {
              if let Some(mut child) = guard.take() {
                let _ = child.kill();
              }
            }
          }
        }
      }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
