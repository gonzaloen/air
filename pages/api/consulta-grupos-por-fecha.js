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

    console.log("Fecha transformada para Airtable:", fechaAirtable);

    // Obtener todos los grupos
    const gruposRecords = await base(process.env.GRUPOS_TABLE_ID).select().all();
    const grupos = gruposRecords.map((record) => ({
      id: record.id,
      ...record.fields,
    }));

    console.log("Total de grupos obtenidos:", grupos.length);

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

    console.log("Total de disponibilidades obtenidas:", disponibilidades.length);

    // Determinar grupos no disponibles
    const gruposNoDisponiblesNombres = disponibilidades
      .map((d) => d["Nombre del grupo"])
      .filter(Boolean); // Eliminar valores undefined o null

    const noDisponibles = grupos
      .filter((grupo) => gruposNoDisponiblesNombres.includes(grupo["Name"]))
      .map((grupo) => {
        const disponibilidad = disponibilidades.find(
          (d) => d["Nombre del grupo"] === grupo["Name"]
        );
        return {
          ...grupo,
          Disponibilidad: {
            Fecha: disponibilidad?.Fecha,
            Estado: disponibilidad?.Estado,
            Población: disponibilidad?.Población,
            ContratadoPor: disponibilidad?.["Contratado por"]
          },
        };
      });

    // Determinar grupos disponibles
    const disponibles = grupos.filter(
      (grupo) => !gruposNoDisponiblesNombres.includes(grupo["Name"])
    );

    console.log("Total de grupos disponibles:", disponibles.length);

    // Responder con los resultados, priorizando "no disponibles"
    res.status(200).json({
      noDisponibles,
      disponibles
    });
  } catch (error) {
    console.error("Error al consultar los grupos:", error.message);
    res.status(500).json({ error: "Hubo un error al consultar los grupos." });
  }
}
