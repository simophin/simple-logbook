use crate::state::AppState;

pub async fn print_pdf(req: tide::Request<AppState>) -> tide::Result {
    use crate::service::invoice::print_pdf::*;

    let contents = execute(req.state(), req.query()?).await?;

    Ok(tide::Response::builder(tide::StatusCode::Ok)
        .body(contents)
        .content_type(tide::http::Mime::from("application/pdf"))
        .header("Content-Disposition", "attachment; filename=Invoice.pdf")
        .build())
}
