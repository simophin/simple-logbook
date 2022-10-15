use super::list::AttachmentSigned;
use crate::service::login::creds::CredentialsConfig;
use crate::service::Error;
use crate::AppState;

mod sql {
    use crate::state::AppState;

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

    pub async fn execute(
        state: &AppState,
        Input { id }: Input,
    ) -> sqlx::Result<Option<Attachment>> {
        sqlx::query_as(SQL)
            .bind(id)
            .fetch_optional(&state.conn)
            .await
    }
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
