import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  const { nombre_del_grupo, estilo, caché_mínimo, caché_máximo } = req.query;

  try {
    // Obtener todos los registros de la tabla "Grupos"
    const records = await base(process.env.GRUPOS_TABLE_ID).select().all();

    // Mapear los datos
    let grupos = records.map((record) => ({
      id: record.id,
      ...record.fields,
    }));

    // Filtrar por nombre del grupo
    if (nombre_del_grupo) {
      grupos = grupos.filter((grupo) =>
        grupo["Nombre del grupo"].toLowerCase().includes(nombre_del_grupo.toLowerCase())
      );
    }

    // Filtrar por estilo musical
    if (estilo) {
      grupos = grupos.filter((grupo) =>
        grupo["Estilo"] && grupo["Estilo"].toLowerCase().includes(estilo.toLowerCase())
      );
    }

    // Filtrar por caché mínimo
    if (caché_mínimo) {
      grupos = grupos.filter((grupo) => grupo["Caché (€)"] >= parseInt(caché_mínimo, 10));
    }

    // Filtrar por caché máximo
    if (caché_máximo) {
      grupos = grupos.filter((grupo) => grupo["Caché (€)"] <= parseInt(caché_máximo, 10));
    }

    // Devolver los resultados filtrados
    res.status(200).json(grupos);
  } catch (error) {
    console.error("Error al consultar grupos:", error.message);
    res.status(500).json({ error: "Hubo un error al consultar los grupos." });
  }
}
