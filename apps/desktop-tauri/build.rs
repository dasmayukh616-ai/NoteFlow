fn main() {
    if let Err(error) = tauri_build::try_build(tauri_build::Attributes::new()) {
        let message = format!("{error:#}");
        let windows_resource_tool_missing = cfg!(windows)
            && (message.contains("RC.EXE")
                || message.contains("rc.exe")
                || message.contains("Windows Resource")
                || message.contains("resource compiler"));

        if windows_resource_tool_missing {
            println!(
                "cargo:warning=Windows SDK resource tooling is missing. Install the Windows SDK so RC.EXE is available for Tauri bundles."
            );
            println!("cargo:warning={message}");
            return;
        }

        println!("{message}");
        std::process::exit(1);
    }
}
