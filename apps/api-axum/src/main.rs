use api_axum::{ApiConfig, serve};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    serve(ApiConfig::from_env()?).await?;
    Ok(())
}
