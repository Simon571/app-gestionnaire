use std::process::{Child, Command};
use std::sync::Mutex;

pub struct ServerHandle {
    pub child: Mutex<Option<Child>>,
}

impl ServerHandle {
    pub fn new() -> Self {
        ServerHandle {
            child: Mutex::new(None),
        }
    }

    pub fn start_server(&self, app_handle: &tauri::AppHandle) -> Result<(), String> {
        let resource_dir = app_handle
            .path_resolver()
            .resource_dir()
            .ok_or("Failed to get resource directory")?;

        let node_path = resource_dir.join("node").join("node.exe");
        let server_path = resource_dir.join("server").join("server.js");

        if !node_path.exists() {
            return Err(format!("Node executable not found at {:?}", node_path));
        }

        if !server_path.exists() {
            return Err(format!("Server file not found at {:?}", server_path));
        }

        let child = Command::new(node_path)
            .arg(server_path)
            .spawn()
            .map_err(|e| format!("Failed to start server: {}", e))?;

        *self.child.lock().unwrap() = Some(child);
        Ok(())
    }

    pub fn stop_server(&self) {
        if let Some(mut child) = self.child.lock().unwrap().take() {
            let _ = child.kill();
        }
    }
}

impl Drop for ServerHandle {
    fn drop(&mut self) {
        self.stop_server();
    }
}
