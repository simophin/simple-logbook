#[macro_export]
macro_rules! impl_deref {
    ($rootType:ident, $field:ident, $fieldType:ident) => {
        impl std::ops::Deref for $rootType {
            type Target = $fieldType;

            fn deref(&self) -> &Self::Target {
                &self.$field
            }
        }
    };
}

#[cfg(test)]
pub fn random_string() -> String {
    uuid::Uuid::new_v4().to_string()
}
