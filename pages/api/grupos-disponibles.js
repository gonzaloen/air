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

    // Obtener todos los grupos
    const gruposRecords = await base(process.env.GRUPOS_TABLE_ID).select().all();
    const grupos = gruposRecords.map((record) => ({
      id: record.id,
      ...record.fields,
    }));

    console.log("Total de grupos:", grupos.length);

    // Obtener disponibilidades en esa fecha
    const disponibilidadesRecords = await base(process.env.DISPONIBILIDADES_TABLE_ID)
      .select({
        filterByFormula: `AND({Fecha} = "${fechaAirtable}", OR({Estado} = "Reservado", {Estado} = "Confirmado"))`,
      })
      .all();

    console.log("Total de disponibilidades en esa fecha:", disponibilidadesRecords.length);

    const gruposOcupados = disponibilidadesRecords.map((record) => record.fields["Nombre del grupo"]);

    // Filtrar grupos disponibles
    const gruposDisponibles = grupos.filter(
      (grupo) => !gruposOcupados.includes(grupo["Nombre del grupo"])
    );

    console.log("Total de grupos disponibles:", gruposDisponibles.length);

    res.status(200).json(gruposDisponibles);
  } catch (error) {
    console.error("Error en grupos-disponibles.js:", error.message);
    res.status(500).json({ error: error.message });
  }
}
