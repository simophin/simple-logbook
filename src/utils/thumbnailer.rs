use std::process::Stdio;

use anyhow::Context;
use tokio::{
    io::{copy, AsyncRead},
    process::{ChildStdout, Command},
    spawn,
};
use tokio_util::io::ReaderStream;

pub async fn generate_thumbnail(
    max_width: usize,
    mut input: impl AsyncRead + Unpin + Send + Sync + 'static,
) -> anyhow::Result<(&'static str, ReaderStream<ChildStdout>)> {
    let mut cmd = Command::new("sh");
    let child = cmd
        .args([
            "-c",
            &format!("magick - jpeg:- | magick - -resize {max_width} jpeg:-"),
        ])
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .context("Running imagemagick")?;

    let mut stdin = child.stdin.unwrap();
    let stdout = child.stdout.unwrap();

    spawn(async move {
        let _ = copy(&mut input, &mut stdin).await;
    });

    Ok(("image/jpeg", ReaderStream::new(stdout)))
}
