const Airtable = require("airtable");

// Configura Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  const { fecha } = req.query;

  if (!fecha) {
    return res.status(400).json({ error: "Por favor, proporciona una fecha en el formato dd/mm/aaaa" });
  }

  try {
    // Obtener todos los grupos
    const gruposRecords = await base(process.env.GRUPOS_TABLE_ID).select().all();
    const grupos = gruposRecords.map((record) => ({
      id: record.id,
      ...record.fields,
    }));

    // Obtener todas las disponibilidades para la fecha dada
    const disponibilidadesRecords = await base(process.env.DISPONIBILIDADES_TABLE_ID)
      .select({
        filterByFormula: `AND(FECHA("${fecha}"), OR({Estado} = "Reservado", {Estado} = "Confirmado"))`,
      })
      .all();

    const gruposOcupados = disponibilidadesRecords.map((record) => record.fields["Nombre del grupo"]);

    // Filtrar grupos disponibles
    const gruposDisponibles = grupos.filter(
      (grupo) => !gruposOcupados.includes(grupo["Nombre del grupo"])
    );

    res.status(200).json(gruposDisponibles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
