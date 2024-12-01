const Airtable = require("airtable");

// Configuración de Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  const { fecha } = req.query;

  if (!fecha) {
    return res.status(400).json({ error: "Por favor, proporciona una fecha en el formato dd/mm/aaaa" });
  }

  try {
    // Transformar la fecha al formato requerido por Airtable (aaaa-mm-dd)
    const [day, month, year] = fecha.split("/");
    const fechaAirtable = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

    // Log para depurar
    console.log("Fecha transformada para Airtable:", fechaAirtable);

    const records = await base(process.env.DISPONIBILIDADES_TABLE_ID)
      .select({
        filterByFormula: `{Fecha} = "${fechaAirtable}"`,
      })
      .all();

    // Log para depurar resultados obtenidos
    console.log("Registros obtenidos:", records.length);

    const resultados = records.map((record) => ({
      id: record.id,
      ...record.fields,
    }));

    res.status(200).json(resultados);
  } catch (error) {
    console.error("Error en disponibilidades.js:", error.message);
    res.status(500).json({ error: error.message });
  }
}
