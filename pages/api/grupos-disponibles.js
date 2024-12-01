const Airtable = require("airtable");

// Configuración de Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  const { fecha } = req.query;

  if (!fecha) {
    console.error("Fecha no proporcionada en la consulta");
    return res.status(400).json({ error: "Por favor, proporciona una fecha en el formato dd/mm/aaaa" });
  }

  try {
    // Log de la fecha recibida
    console.log("Fecha recibida:", fecha);

    // Obtener todos los grupos
    const gruposRecords = await base(process.env.GRUPOS_TABLE_ID).select().all();
    console.log("Grupos obtenidos:", gruposRecords.length);

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
    console.log("Disponibilidades obtenidas:", disponibilidadesRecords.length);

    const gruposOcupados = disponibilidadesRecords.map((record) => record.fields["Nombre del grupo"]);

    // Filtrar los grupos disponibles
    const gruposDisponibles = grupos.filter(
      (grupo) => !gruposOcupados.includes(grupo["Nombre del grupo"])
    );

    // Log de grupos disponibles
    console.log("Grupos disponibles:", gruposDisponibles.length);

    res.status(200).json(gruposDisponibles);
  } catch (error) {
    console.error("Error en el servidor:", error.message);
    res.status(500).json({ error: error.message });
  }
}
