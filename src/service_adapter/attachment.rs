use std::borrow::Cow;
use std::pin::Pin;
use std::task::{Context, Poll};

use bytes::Bytes;
use futures_util::Stream;
use multer::{parse_boundary, Multipart};

use crate::service::Error;
use crate::state::AppState;
use futures_io::AsyncBufRead;
use sqlx::types::Json;
use tide::StatusCode;

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

    let mut mime_type = None;
    let mut data = None;
    let mut name = None;
    let mut multipart = Multipart::new(TideBody(req.take_body()), boundary);
    while let Some(field) = multipart.next_field().await? {
        match field.name() {
            Some("file") => {
                mime_type = field.content_type().map(|v| Cow::from(v.to_string()));
                name = Some(Cow::from(
                    field
                        .file_name()
                        .ok_or_else(|| Error::InvalidArgument(Cow::from("File name is empty")))?
                        .to_string(),
                ));
                data = Some(field.bytes().await?);
            }
            _ => return Err(Error::InvalidArgument(Cow::from("Unknown field name")).into()),
        }
    }

    let data = data.ok_or_else(|| Error::InvalidArgument(Cow::from("data is missing")))?;
    let name = name.ok_or_else(|| Error::InvalidArgument(Cow::from("file_name is missing")))?;
    let response = execute(
        req.state(),
        Input {
            data,
            name,
            mime_type,
        },
    )
    .await?;
    Ok(tide::Response::from(tide::Body::from_json(&response)?))
}

#[derive(serde::Deserialize)]
struct GetQuery {
    id: String,
}

pub async fn get(req: tide::Request<AppState>) -> tide::Result {
    use crate::service::attachment::list::*;

    let Attachment {
        mime_type,
        created,
        last_updated,
        data,
        data_hash,
        ..
    } = execute(
        req.state(),
        Input {
            req: Default::default(),
            includes: Some(Json(vec![req.query::<GetQuery>()?.id])),
            with_data: true,
        },
    )
    .await?
    .data
    .into_iter()
    .next()
    .ok_or_else(|| Error::ResourceNotFound)?;

    let latest_etag = sodiumoxide::base64::encode(
        data_hash.expect("To have data"),
        sodiumoxide::base64::Variant::UrlSafeNoPadding,
    );
    match req.header("If-None-Match") {
        Some(v) if v.last().as_str() == latest_etag => {
            return Ok(tide::Response::new(StatusCode::NotModified));
        }
        _ => {}
    }

    let mut res = tide::Response::from(tide::Body::from_bytes(data.expect("To have data")));
    res.insert_header(
        "Last-Modified",
        last_updated.format(super::HTTP_DATE_FORMAT).to_string(),
    );
    res.insert_header("ETag", latest_etag);
    res.insert_header("Cache-Control", "no-cache");
    res.insert_header("Date", created.format(super::HTTP_DATE_FORMAT).to_string());
    res.set_content_type(mime_type.as_str());
    Ok(res)
}
