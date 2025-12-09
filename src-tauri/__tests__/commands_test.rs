// Unit tests for business logic
use remote_pilot_for_github_copilot_desktop_lib::{greet_impl, is_speech_available_impl};

#[test]
fn test_greet_basic() {
    let result = greet_impl("Tauri");
    assert_eq!(result, "Hello, Tauri! You've been greeted from Rust!");
}

#[test]
fn test_greet_empty_name() {
    let result = greet_impl("");
    assert_eq!(result, "Hello, ! You've been greeted from Rust!");
}

#[test]
fn test_greet_with_special_characters() {
    let result = greet_impl("Alice & Bob");
    assert_eq!(result, "Hello, Alice & Bob! You've been greeted from Rust!");
}

#[test]
fn test_greet_with_unicode() {
    let result = greet_impl("你好");
    assert_eq!(result, "Hello, 你好! You've been greeted from Rust!");
}

#[test]
fn test_greet_with_emojis() {
    let result = greet_impl("🚀 Tauri");
    assert_eq!(result, "Hello, 🚀 Tauri! You've been greeted from Rust!");
}

#[test]
fn test_greet_with_long_name() {
    let long_name = "a".repeat(1000);
    let result = greet_impl(&long_name);
    assert!(result.starts_with("Hello, "));
    assert!(result.ends_with("! You've been greeted from Rust!"));
    assert!(result.contains(&long_name));
}

#[test]
fn test_is_speech_available_returns_bool() {
    let result = is_speech_available_impl();
    // Should be true on Windows, false on other platforms
    #[cfg(windows)]
    assert_eq!(result, true);
    #[cfg(not(windows))]
    assert_eq!(result, false);
}

#[test]
fn test_is_speech_available_consistency() {
    // Function should return the same value on repeated calls
    let result1 = is_speech_available_impl();
    let result2 = is_speech_available_impl();
    assert_eq!(result1, result2);
}
