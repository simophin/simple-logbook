use serde::Serializer;

pub mod balance;
pub mod sum;

#[derive(serde::Deserialize)]
enum Frequency {
    Daily,
    Weekly,
    Monthly,
    Yearly,
}

impl serde::Serialize for Frequency {
    fn serialize<S>(&self, serializer: S) -> Result<<S as Serializer>::Ok, <S as Serializer>::Error>
    where
        S: Serializer,
        for<'c> &'c str: serde::Serialize,
    {
        let s = match self {
            Frequency::Daily => "%Y-%j",
            Frequency::Weekly => "%Y-%W",
            Frequency::Monthly => "%Y-%m",
            Frequency::Yearly => "%Y",
        };

        s.serialize(serializer)
    }
}
