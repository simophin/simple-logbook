use std::borrow::Cow;
use std::pin::Pin;
use std::task::{Context, Poll};

use bytes::Bytes;
use futures_util::{AsyncWriteExt, Stream};
use multer::{parse_boundary, Multipart};

use crate::service::login::creds::{CredentialsConfig, Signed};
use crate::service::Error;
use crate::state::AppState;
use futures_io::AsyncBufRead;
use sqlx::types::Json;

struct TideBody(tide::Body);

impl Stream for TideBody {
    type Item = std::io::Result<Bytes>;

    fn poll_next(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {
        match AsyncBufRead::poll_fill_buf(Pin::new(&mut self.0), cx) {
            Poll::Ready(Ok(buf)) => {
                if buf.is_empty() {
                    return Poll::Ready(None);
                }
                let buf = Bytes::copy_from_slice(buf);
                AsyncBufRead::consume(Pin::new(&mut self.0), buf.len());
                Poll::Ready(Some(Ok(buf)))
            }
            Poll::Ready(Err(err)) => Poll::Ready(Some(Err(err))),
            Poll::Pending => Poll::Pending,
        }
    }
}

pub async fn post(mut req: tide::Request<AppState>) -> tide::Result {
    use crate::service::attachment::save::*;
    let boundary = parse_boundary(
        req.content_type()
            .ok_or_else(|| Error::InvalidArgument(Cow::from("No content-type available")))?
            .to_string(),
    )
    .map_err(|_| Error::InvalidArgument(Cow::from("No boundary")))?;

    let mut mime_type = "application/octet-stream".to_string();
    let mut data = None;
    let mut name = None;
    let mut multipart = Multipart::new(TideBody(req.take_body()), boundary);
    while let Some(field) = multipart.next_field().await? {
        match field.name() {
            Some("file") => {
                if let Some(v) = field.content_type() {
                    mime_type = v.to_string();
                }
                name = Some(Cow::from(
                    field
                        .file_name()
                        .ok_or_else(|| Error::InvalidArgument(Cow::from("File name is empty")))?
                        .to_string(),
                ));
                data = Some(field.bytes().await?);
                break;
            }
            _ => return Err(Error::InvalidArgument(Cow::from("Unknown field name")).into()),
        }
    }

    let (data, mime_type) = gen_thumbnail(
        data.ok_or_else(|| Error::InvalidArgument(Cow::from("data is missing")))?
            .to_vec(),
        2048,
        2048,
        &mime_type,
    )
    .await?;
    let name = name.ok_or_else(|| Error::InvalidArgument(Cow::from("file_name is missing")))?;
    let response = execute(
        req.state(),
        Input {
            data: data.as_ref(),
            name,
            mime_type: Some(Cow::from(mime_type)),
        },
    )
    .await?;
    Ok(tide::Response::from(tide::Body::from_json(&response)?))
}

async fn gen_thumbnail(
    data: Vec<u8>,
    max_width: u32,
    max_height: u32,
    mime_type: &str,
) -> anyhow::Result<(Vec<u8>, &str)> {
    use async_std::process::{Command, Stdio};
    let mut child = if mime_type.starts_with("application/pdf") {
        Command::new("convert")
            .arg("-density")
            .arg("100")
            .arg("-resize")
            .arg(format!("{}x{}", max_width, max_height))
            .arg("-")
            .arg("png:-")
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .spawn()?
    } else {
        Command::new("convert")
            .arg("-resize")
            .arg(format!("{}x{}", max_width, max_height))
            .arg("-")
            .arg("png:-")
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .spawn()?
    };

    child.stdin.as_mut().unwrap().write_all(&data).await?;
    let status = child.output().await?;
    if !status.status.success() {
        return Err(anyhow::anyhow!("Error running process"));
    }
    Ok((status.stdout, "image/png"))
}

#[derive(serde::Deserialize)]
struct GetQuery<'a> {
    id: Signed<'a>,
    preview: Option<u32>,
}

pub async fn get(req: tide::Request<AppState>) -> tide::Result {
    use crate::service::attachment::list::*;
    use crate::service::attachment::sign::*;

    let GetQuery { id, preview } = req.query()?;
    let config = CredentialsConfig::from_app(req.state()).await;
    let id = verify(&id, config.as_ref()).ok_or_else(|| Error::ResourceNotFound)?;

    let Attachment {
        mime_type, data, ..
    } = execute_sql(
        req.state(),
        Input {
            req: Default::default(),
            includes: Some(Json(vec![id])),
            accounts: None,
            with_data: true,
        },
    )
    .await?
    .data
    .into_iter()
    .next()
    .ok_or_else(|| Error::ResourceNotFound)?;

    let mut data = data.expect("To have data");
    let mut mime_type = mime_type.as_str();

    match preview {
        Some(max)
            if mime_type.starts_with("image/") || mime_type.starts_with("application/pdf") =>
        {
            let (resized_data, resized_mime_type) =
                gen_thumbnail(data, max, max, mime_type).await?;
            mime_type = resized_mime_type;
            data = resized_data;
        }

        _ => {}
    }

    let mut res = tide::Response::from(tide::Body::from_bytes(data));
    res.insert_header("Cache-Control", "immutable");
    res.set_content_type(mime_type);
    Ok(res)
}
