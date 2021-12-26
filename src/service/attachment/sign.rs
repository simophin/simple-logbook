use crate::service::login::creds::{Asset, CredentialsConfig, Signed};
use std::borrow::Cow;
use std::time::Duration;

const ATTACHMENT_SIGNATURE_EXP_DURATION: Duration = Duration::from_secs(60 * 10);
const ATTACHMENT_SIGNATURE_KIND: &str = "attachments";

pub fn sign(id: &str, config: Option<&CredentialsConfig>) -> Signed<'static> {
    Asset::new(
        ATTACHMENT_SIGNATURE_EXP_DURATION,
        Some(ATTACHMENT_SIGNATURE_KIND),
        Some(id),
    )
    .sign(config)
}

pub fn verify(signed: &Signed, config: Option<&CredentialsConfig>) -> Option<String> {
    match Asset::verify(signed, config) {
        Some(Asset { id, kind, .. })
            if kind == Some(Cow::from(ATTACHMENT_SIGNATURE_KIND)) && id.is_some() =>
        {
            Some(id.unwrap().into_owned())
        }
        _ => None,
    }
}
