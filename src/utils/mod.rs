pub mod thumbnailer;

#[cfg(test)]
pub fn random_string() -> String {
    uuid::Uuid::new_v4().to_string()
}
