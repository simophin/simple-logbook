use headless_chrome::protocol::page::PrintToPdfOptions;
use headless_chrome::{Browser, LaunchOptionsBuilder};

use crate::state::AppState;

#[derive(serde::Deserialize)]
pub struct Input {
    pub id: String,
    pub token: Option<String>,
}

#[cfg(debug_assertions)]
fn get_react_port(_: &AppState) -> u16 {
    3000
}

#[cfg(not(debug_assertions))]
fn get_react_port(state: &AppState) -> u16 {
    state.port
}

pub async fn execute(
    state: &AppState,
    Input { id, token }: Input,
) -> crate::service::Result<Vec<u8>> {
    let mut url = tide::http::Url::parse("http://localhost")?;
    url.set_port(Some(get_react_port(state))).unwrap();
    url.set_path("/invoice/view");
    url.path_segments_mut().unwrap().push(&id);
    url.query_pairs_mut().append_pair("fullScreen", "true");

    if let Some(token) = token {
        url.query_pairs_mut().append_pair("token", &token);
    }

    let url = url.to_string();

    async_std::task::spawn_blocking(move || -> Result<Vec<u8>, failure::Error> {
        let options = LaunchOptionsBuilder::default()
            .headless(true)
            .sandbox(true)
            .build()
            .map_err(|e| failure::err_msg(e))?;
        let data = Browser::new(options)?
            .wait_for_initial_tab()?
            .navigate_to(&url)?
            .wait_until_navigated()?
            .print_to_pdf(Some(PrintToPdfOptions {
                landscape: None,
                display_header_footer: None,
                print_background: Some(true),
                scale: None,
                paper_width: None,
                paper_height: None,
                margin_top: None,
                margin_bottom: None,
                margin_left: None,
                margin_right: None,
                page_ranges: None,
                ignore_invalid_page_ranges: None,
                header_template: None,
                footer_template: None,
                prefer_css_page_size: None,
            }))?;

        Ok(data)
    })
    .await
    .map_err(|e| crate::service::Error::Other(anyhow::anyhow!(e.to_string())))
}
