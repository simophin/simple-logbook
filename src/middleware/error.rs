pub async fn execute(mut res: tide::Response) -> tide::Result {
    use crate::service::Error;
    use tide::StatusCode;

    let (status, body) = match res.downcast_error::<Error>() {
        Some(Error::InvalidCredentials) => (StatusCode::Forbidden, None),
        Some(Error::InvalidArgument(msg)) => (
            StatusCode::BadRequest,
            Some(serde_json::json!({
                "name": "invalid_argument",
                "message": msg.as_ref(),
            })),
        ),
        Some(Error::ResourceNotFound) => (
            StatusCode::NotFound,
            Some(serde_json::json!({
                "name": "resource_not_found",
            })),
        ),
        Some(Error::Other(err)) => (
            StatusCode::InternalServerError,
            Some(serde_json::json!({
                "name": "unknown",
                "message": err.to_string(),
            })),
        ),
        None => return Ok(res),
    };

    res.set_status(status);
    if let Some(body) = body {
        res.set_body(body);
    }
    Ok(res)
}
