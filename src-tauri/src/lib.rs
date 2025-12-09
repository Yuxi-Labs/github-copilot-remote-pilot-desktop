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

// Tauri command wrappers (private thin layer)
#[tauri::command]
fn greet(name: &str) -> String {
    greet_impl(name)
}

#[tauri::command]
fn is_speech_available() -> bool {
    is_speech_available_impl()
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


