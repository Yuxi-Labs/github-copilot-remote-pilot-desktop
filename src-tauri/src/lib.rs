use std::sync::Mutex;
use tauri::State;

// Speech recognition state
struct SpeechState {
    is_listening: Mutex<bool>,
}
// Business logic functions (public for testing)
pub fn greet_impl(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Check if Windows speech recognition is available
pub fn is_speech_available_impl() -> bool {
    #[cfg(windows)]
    {
        true // Windows Speech API is built into Windows 10+
    }
    #[cfg(not(windows))]
    {
        false
    }
}

/// Get available shells on the local system
pub fn get_available_shells_impl() -> Vec<String> {
    let mut shells = Vec::new();

    #[cfg(windows)]
    {
        use std::process::Command;
        
        // Use PowerShell to find all executables in PATH that could be shells
        let output = Command::new("powershell")
            .args(&[
                "-NoProfile",
                "-Command",
                r#"
                $shells = @()
                
                # Get all executables from PATH
                $env:PATH -split ';' | Where-Object { $_ -and (Test-Path $_) } | ForEach-Object {
                    Get-ChildItem -Path $_ -Filter *.exe -ErrorAction SilentlyContinue | ForEach-Object {
                        $name = $_.BaseName.ToLower()
                        # Common shell patterns
                        if ($name -match '^(pwsh|powershell|cmd|bash|sh|zsh|fish|nu|elvish|xonsh|ion|ksh|tcsh|csh|dash|ash)$') {
                            $shells += $name
                        }
                    }
                }
                
                # Check Windows Terminal profiles for additional shells
                $wtSettingsPath = "$env:LOCALAPPDATA\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json"
                if (Test-Path $wtSettingsPath) {
                    try {
                        $content = Get-Content $wtSettingsPath -Raw | ConvertFrom-Json
                        foreach ($profile in $content.profiles.list) {
                            if ($profile.commandline) {
                                $cmd = $profile.commandline -replace '"', '' -split ' ' | Select-Object -First 1
                                $shellName = Split-Path $cmd -Leaf
                                $shellName = $shellName -replace '\.exe$', ''
                                if ($shellName) {
                                    $shells += $shellName.ToLower()
                                }
                            }
                        }
                    } catch {}
                }
                
                # Check for WSL distributions
                if (Get-Command wsl -ErrorAction SilentlyContinue) {
                    try {
                        $wslDistros = wsl -l -q 2>$null | Where-Object { $_ }
                        foreach ($distro in $wslDistros) {
                            $distroName = $distro.Trim()
                            if ($distroName) {
                                $shells += "wsl:$distroName"
                            }
                        }
                    } catch {}
                }
                
                $shells | Sort-Object -Unique | ForEach-Object { Write-Output $_ }
                "#
            ])
            .output();

        if let Ok(output) = output {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout);
                for line in stdout.lines() {
                    let shell = line.trim();
                    if !shell.is_empty() && !shells.contains(&shell.to_string()) {
                        shells.push(shell.to_string());
                    }
                }
            }
        }
        
        // Fallback: at minimum ensure cmd exists
        if shells.is_empty() {
            shells.push("cmd".to_string());
        }
    }

    #[cfg(target_os = "macos")]
    {
        // Read /etc/shells to find all registered shells
        if let Ok(contents) = std::fs::read_to_string("/etc/shells") {
            for line in contents.lines() {
                let line = line.trim();
                if !line.is_empty() && !line.starts_with('#') {
                    if let Some(shell_name) = line.split('/').last() {
                        if std::path::Path::new(line).exists() && !shells.contains(&shell_name.to_string()) {
                            shells.push(shell_name.to_string());
                        }
                    }
                }
            }
        }
    }

    #[cfg(target_os = "linux")]
    {
        // Read /etc/shells to find all registered shells
        if let Ok(contents) = std::fs::read_to_string("/etc/shells") {
            for line in contents.lines() {
                let line = line.trim();
                if !line.is_empty() && !line.starts_with('#') {
                    if let Some(shell_name) = line.split('/').last() {
                        if std::path::Path::new(line).exists() && !shells.contains(&shell_name.to_string()) {
                            shells.push(shell_name.to_string());
                        }
                    }
                }
            }
        }
    }

    shells
}

// Tauri command wrappers (private thin layer)
#[tauri::command]
fn greet(name: &str) -> String {
    greet_impl(name)
}

#[tauri::command]
fn is_speech_available() -> bool {
    is_speech_available_impl()
}

#[tauri::command]
fn get_available_shells() -> Vec<String> {
    get_available_shells_impl()
}

/// Start listening for speech input
/// Returns the recognized text when speech is detected
#[tauri::command]
async fn start_speech_recognition(state: State<'_, SpeechState>) -> Result<String, String> {
    // Set listening state
    {
        let mut is_listening = state.is_listening.lock().map_err(|e| e.to_string())?;
        if *is_listening {
            return Err("Already listening".to_string());
        }
        *is_listening = true;
    }

    #[cfg(windows)]
    {
        use windows::Media::SpeechRecognition::{
            SpeechRecognizer, SpeechRecognitionResult,
        };
        use windows::Foundation::IAsyncOperation;

        let result = async {
            // Create speech recognizer
            let recognizer = SpeechRecognizer::new()
                .map_err(|e| format!("Failed to create speech recognizer: {}", e))?;

            // Compile the default grammar
            let compile_op = recognizer.CompileConstraintsAsync()
                .map_err(|e| format!("Failed to compile constraints: {}", e))?;
            compile_op.get()
                .map_err(|e| format!("Failed to get compile result: {}", e))?;

            // Start recognition session (required to initialize recognizer)
            let _session = recognizer.ContinuousRecognitionSession()
                .map_err(|e| format!("Failed to get recognition session: {}", e))?;

            // Use single recognition for simplicity
            let recognize_op: IAsyncOperation<SpeechRecognitionResult> = recognizer.RecognizeAsync()
                .map_err(|e| format!("Failed to start recognition: {}", e))?;

            let result = recognize_op.get()
                .map_err(|e| format!("Recognition failed: {}", e))?;

            let text = result.Text()
                .map_err(|e| format!("Failed to get text: {}", e))?;

            Ok::<String, String>(text.to_string())
        }.await;

        // Reset listening state
        {
            let mut is_listening = state.is_listening.lock().map_err(|e| e.to_string())?;
            *is_listening = false;
        }

        result
    }

    #[cfg(not(windows))]
    {
        // Reset listening state
        {
            let mut is_listening = state.is_listening.lock().map_err(|e| e.to_string())?;
            *is_listening = false;
        }
        Err("Speech recognition is only available on Windows".to_string())
    }
}

/// Stop listening for speech
#[tauri::command]
fn stop_speech_recognition(state: State<'_, SpeechState>) -> Result<(), String> {
    let mut is_listening = state.is_listening.lock().map_err(|e| e.to_string())?;
    *is_listening = false;
    Ok(())
}

/// Check if currently listening
#[tauri::command]
fn is_listening(state: State<'_, SpeechState>) -> bool {
    state.is_listening.lock().map(|l| *l).unwrap_or(false)
}

/// Store sensitive data securely (e.g., auth tokens)
#[tauri::command]
fn secure_store(key: String, value: String, app: tauri::AppHandle) -> Result<(), String> {
    use tauri_plugin_store::StoreExt;
    
    let store = app.store("secure.json")
        .map_err(|e| format!("Failed to access store: {}", e))?;
    
    store.set(key, serde_json::Value::String(value));
    store.save().map_err(|e| format!("Failed to save: {}", e))?;
    
    Ok(())
}

/// Retrieve sensitive data securely
#[tauri::command]
fn secure_retrieve(key: String, app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_store::StoreExt;
    
    let store = app.store("secure.json")
        .map_err(|e| format!("Failed to access store: {}", e))?;
    
    match store.get(&key) {
        Some(value) => {
            if let Some(s) = value.as_str() {
                Ok(Some(s.to_string()))
            } else {
                Ok(None)
            }
        }
        None => Ok(None)
    }
}

/// Delete sensitive data securely
#[tauri::command]
fn secure_delete(key: String, app: tauri::AppHandle) -> Result<(), String> {
    use tauri_plugin_store::StoreExt;
    
    let store = app.store("secure.json")
        .map_err(|e| format!("Failed to access store: {}", e))?;
    
    store.delete(&key);
    store.save().map_err(|e| format!("Failed to save: {}", e))?;
    
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .manage(SpeechState {
            is_listening: Mutex::new(false),
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            is_speech_available,
            get_available_shells,
            start_speech_recognition,
            stop_speech_recognition,
            is_listening,
            secure_store,
            secure_retrieve,
            secure_delete
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}


