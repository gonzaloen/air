import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  const { fecha } = req.query;

  if (!fecha) {
    return res.status(400).json({ error: "Por favor, proporciona una fecha en el formato dd/mm/aaaa" });
  }

  try {
    // Transformar la fecha al formato compatible con Airtable (aaaa-mm-dd)
    const [day, month, year] = fecha.split("/");
    const fechaAirtable = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

    // Obtener todos los grupos
    const gruposRecords = await base(process.env.GRUPOS_TABLE_ID).select().all();
    const grupos = gruposRecords.map((record) => ({
      id: record.id,
      ...record.fields,
    }));

    // Obtener todas las disponibilidades para la fecha
    const disponibilidadesRecords = await base(process.env.DISPONIBILIDADES_TABLE_ID)
      .select({
        filterByFormula: `AND(IS_SAME({Fecha}, "${fechaAirtable}", 'day'))`,
      })
      .all();

    const disponibilidades = disponibilidadesRecords.map((record) => ({
      id: record.id,
      ...record.fields,
    }));

    // Determinar grupos no disponibles
    const gruposNoDisponiblesNombres = disponibilidades.map((d) => d["Nombre del grupo"].toLowerCase());

    const noDisponibles = grupos
      .filter((grupo) => gruposNoDisponiblesNombres.includes(grupo["Nombre del grupo"].toLowerCase()))
      .map((grupo) => {
        const disponibilidad = disponibilidades.find(
          (d) => d["Nombre del grupo"].toLowerCase() === grupo["Nombre del grupo"].toLowerCase()
        );
        return {
          ...grupo,
          Disponibilidad: disponibilidad, // Añadimos los datos de la tabla disponibilidades
        };
      });

    // Responder con los resultados
    res.status(200).json({
      grupos, // Todos los grupos
      disponibilidades: noDisponibles, // Solo los grupos con disponibilidad registrada
    });
  } catch (error) {
    console.error("Error en consulta-grupos-por-fecha.js:", error.message);
    res.status(500).json({ error: "Hubo un error al consultar los grupos." });
  }
}
