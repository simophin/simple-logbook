use sqlx::Arguments;

pub trait Bindable {
    fn bind_sql_args<'q, A: Arguments<'q>>(&self, args: &mut A) -> anyhow::Result<()>;
}
