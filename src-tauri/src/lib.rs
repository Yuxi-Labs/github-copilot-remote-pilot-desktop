use std::sync::Mutex;
use tauri::State;

// Speech recognition state
struct SpeechState {
    is_listening: Mutex<bool>,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Check if Windows speech recognition is available
#[tauri::command]
fn is_speech_available() -> bool {
    #[cfg(windows)]
    {
        true // Windows Speech API is built into Windows 10+
    }
    #[cfg(not(windows))]
    {
        false
    }
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(SpeechState {
            is_listening: Mutex::new(false),
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            is_speech_available,
            start_speech_recognition,
            stop_speech_recognition,
            is_listening
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
