import Airtable from "airtable";

// Configuración de la base de Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido. Solo se permite POST." });
  }

  const { nombre, email, telefono, fecha, respuesta } = req.body;

  // Validación de datos obligatorios
  if (!nombre || !email || !telefono || !fecha || !respuesta) {
    return res.status(400).json({ error: "Faltan datos necesarios: nombre, email, telefono, fecha o respuesta." });
  }

  try {
    // Usar la variable de entorno para el ID de la tabla
    const tableId = process.env.AIRTABLE_RESPUESTA_TABLE_ID;

    // Crear un nuevo registro en Airtable
    const newRecord = await base(tableId).create([
      {
        fields: {
          Name: nombre,
          email: email,
          teléfono: telefono,
          Fecha: fecha,
          Respuesta: respuesta,
        },
      },
    ]);

    res.status(200).json({
      message: "Registro creado exitosamente.",
      recordId: newRecord[0].id,
    });
  } catch (error) {
    console.error("Error al crear el registro en Airtable:", error.message);
    res.status(500).json({ error: "Hubo un error al crear el registro." });
  }
}
