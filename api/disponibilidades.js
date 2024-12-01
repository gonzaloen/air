const Airtable = require("airtable");

// Configura Airtable
const base = new Airtable({ apiKey: "patQjQHtOmYhHO9v0.afd9c5a1ab9e300d60cd0dd997704ea2e240668985176467002f28244198e7d2" })
  .base("app7ZKGU9mCDF2fa9");

export default async function handler(req, res) {
  const { fecha } = req.query;

  if (!fecha) {
    return res.status(400).json({ error: "Por favor, proporciona una fecha en el formato dd/mm/aaaa" });
  }

  try {
    const records = await base("disponibilidades")
      .select({
        filterByFormula: `AND(FECHA("${fecha}"), {Estado} = "Reservado")`,
      })
      .all();

    const resultados = records.map((record) => ({
      id: record.id,
      ...record.fields,
    }));

    res.status(200).json(resultados);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
