use super::list::AttachmentSigned;
use crate::service::login::creds::CredentialsConfig;
use crate::service::Error;
use crate::AppState;

mod sql {
    use super::super::list::Attachment;

    //language=sql
    const SQL: &str = r#"
select id, mime_type, name, created, lastUpdated
from attachments
where id = ?1
"#;

    pub struct Input {
        pub id: String,
    }

    crate::list_sql_impl!(Input, Attachment, query_as, SQL, id);
}

pub async fn execute(
    state: &AppState,
    id: String,
) -> crate::service::Result<AttachmentSigned<'static>> {
    let c = CredentialsConfig::from_app(state).await;
    match sql::execute(state, sql::Input { id }).await {
        Ok(mut rows) if rows.len() == 1 => {
            let attachment = rows.pop().unwrap();
            Ok(AttachmentSigned {
                signed_id: super::sign::sign(&attachment.id, c.as_ref()),
                attachment,
            })
        }

        Ok(_) => Err(Error::ResourceNotFound),
        Err(e) => Err(e),
    }
}
