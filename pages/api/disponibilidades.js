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

    console.log("Fecha transformada para Airtable:", fechaAirtable);

    // Seleccionar todos los registros que coincidan con la fecha
    const records = await base(process.env.DISPONIBILIDADES_TABLE_ID)
      .select({
        filterByFormula: `{Fecha} = "${fechaAirtable}"`,
      })
      .all();

    console.log("Registros obtenidos:", records.length);

    // Mapear todos los campos de cada registro
    const resultados = records.map((record) => ({
      id: record.id,
      fields: record.fields, // Incluye todos los campos
    }));

    res.status(200).json(resultados);
  } catch (error) {
    console.error("Error en disponibilidades.js:", error.message);
    res.status(500).json({ error: error.message });
  }
}
