// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use tauri_plugin_updater::UpdaterExt;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            // Get splash screen and main window
            let splashscreen_window = app.get_webview_window("splashscreen").unwrap();
            let main_window = app.get_webview_window("main").unwrap();

            // Clone app handle for updater
            let app_handle = app.handle().clone();

            // Close splashscreen and show main window when ready
            tauri::async_runtime::spawn(async move {
                // Wait for the main window to finish loading
                tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;

                // Show main window and close splash
                main_window.show().unwrap();
                splashscreen_window.close().unwrap();
            });

            // Start auto-update checker in background
            tauri::async_runtime::spawn(async move {
                // Wait a bit before starting update checks
                tokio::time::sleep(tokio::time::Duration::from_secs(10)).await;
                check_for_updates(app_handle).await;
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

async fn check_for_updates(app: tauri::AppHandle) {
    // Check for updates every 6 hours
    loop {
        tokio::time::sleep(tokio::time::Duration::from_secs(6 * 60 * 60)).await;

        match app.updater() {
            Ok(updater) => {
                match updater.check().await {
                    Ok(Some(update)) => {
                        println!("Update available: {} -> {}", update.current_version, update.version);

                        // Download and install the update
                        match update.download_and_install(|_, _| {}, || {}).await {
                            Ok(_) => {
                                println!("Update installed successfully, restarting...");
                                app.restart();
                            }
                            Err(e) => {
                                eprintln!("Failed to install update: {}", e);
                            }
                        }
                    }
                    Ok(None) => {
                        println!("No update available");
                    }
                    Err(e) => {
                        eprintln!("Failed to check for updates: {}", e);
                    }
                }
            }
            Err(e) => {
                eprintln!("Failed to get updater: {}", e);
            }
        }
    }
}
