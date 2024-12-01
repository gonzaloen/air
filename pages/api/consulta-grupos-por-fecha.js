import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  const { fecha } = req.query;

  if (!fecha) {
    console.error("Error: No se proporcionó una fecha.");
    return res.status(400).json({ error: "Por favor, proporciona una fecha en el formato dd/mm/aaaa" });
  }

  try {
    // Transformar la fecha al formato compatible con Airtable (aaaa-mm-dd)
    const [day, month, year] = fecha.split("/");
    const fechaAirtable = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    console.log("Fecha transformada para Airtable:", fechaAirtable);

    // Obtener todos los grupos
    const gruposRecords = await base(process.env.GRUPOS_TABLE_ID).select().all();
    console.log("Registros obtenidos de la tabla grupos:", gruposRecords.length);

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

    console.log("Registros obtenidos de la tabla disponibilidades:", disponibilidadesRecords.length);

    const disponibilidades = disponibilidadesRecords.map((record) => ({
      id: record.id,
      ...record.fields,
    }));

    // Determinar grupos no disponibles
    const gruposNoDisponiblesNombres = disponibilidades
      .map((d) => d["Nombre del grupo"]?.toLowerCase()) // Validar si existe 'Nombre del grupo'
      .filter(Boolean); // Eliminar valores undefined o null

    const noDisponibles = grupos
      .filter((grupo) => gruposNoDisponiblesNombres.includes(grupo["Nombre del grupo"]?.toLowerCase()))
      .map((grupo) => {
        const disponibilidad = disponibilidades.find(
          (d) => d["Nombre del grupo"]?.toLowerCase() === grupo["Nombre del grupo"]?.toLowerCase()
        );
        return {
          ...grupo,
          Disponibilidad: disponibilidad, // Añadimos los datos de la tabla disponibilidades
        };
      });

    console.log("Total de grupos no disponibles:", noDisponibles.length);

    // Determinar grupos disponibles
    const disponibles = grupos.filter(
      (grupo) => !gruposNoDisponiblesNombres.includes(grupo["Nombre del grupo"]?.toLowerCase())
    );

    console.log("Total de grupos disponibles:", disponibles.length);

    // Responder con los resultados
    res.status(200).json({
      grupos, // Todos los grupos
      disponibilidades: noDisponibles, // Solo los grupos con disponibilidad registrada
    });
  } catch (error) {
    console.error("Error al consultar los grupos:", error.message);
    res.status(500).json({ error: "Hubo un error al consultar los grupos." });
  }
}
