import { GoogleGenAI, Type } from "@google/genai";

function getGeminiClient(): GoogleGenAI {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Servizio AI non configurato: verifica la chiave API nel pannello Settings > Secrets.");
  }
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function parseJsonSafe(rawText: string | undefined): Record<string, any> {
  let t = (rawText || "").trim();
  if (t.startsWith("```")) {
    const parts = t.split("```");
    t = parts[1] || t;
    if (t.trimStart().startsWith("json")) {
      t = t.trimStart().slice(4);
    }
  }
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    t = t.slice(start, end + 1);
  }
  return JSON.parse(t);
}

const BOLLETTA_SYSTEM =
  "Sei un analista esperto di bollette energetiche italiane (luce e gas). " +
  "Rispondi ESCLUSIVAMENTE con un oggetto JSON valido conforme allo schema richiesto.";

const BOLLETTA_PROMPT =
  "Analizza la bolletta allegata ed estrai i dati richiesti: fornitore, tipo_fornitura (luce, gas o dual), " +
  "consumo_annuo (kWh per la luce, Smc per il gas), unita_consumo (kWh o Smc), costo_materia_prima (EUR/kWh o EUR/Smc attuale), " +
  "spesa_annua_stimata (EUR totali stimati all'anno), codice_pod (luce, formato IT...), codice_pdr (gas), " +
  "risparmio_stimato_annuo (EUR risparmiabili stimati confrontando il costo materia prima con gli indici PUN/PSV correnti del mercato italiano) e note.";

const MACCHINARIO_SYSTEM =
  "Sei un perito esperto di attrezzature edili, macchinari e utensili per il noleggio e mercatino dell'usato. " +
  "Rispondi ESCLUSIVAMENTE con un oggetto JSON valido conforme allo schema richiesto.";

const MACCHINARIO_PROMPT =
  "Analizza la foto dell'attrezzo/macchinario allegata e compila i campi suggeriti per un annuncio in italiano: " +
  "titolo_suggerito (breve e commerciale), categoria (una tra: Movimento terra, Edilizia e betoniere, Ponteggi e facciate, " +
  "Lavori in quota, Elettroutensili, Giardinaggio, Idraulica e riscaldamento, Trasporto e sollevamento, Pulizia industriale, Altro), " +
  "stato_usura (Nuovo, Ottimo, Buono, Revisionato, Da sistemare), descrizione_breve (1-2 frasi) e tag_ricerca (3-6 parole chiave).";

export async function analyzeBollettaFiles(
  files: Array<{ data: Buffer; mimeType: string }>
): Promise<Record<string, any>> {
  const ai = getGeminiClient();
  const parts: Array<any> = files.map((f) => ({
    inlineData: {
      mimeType: f.mimeType,
      data: f.data.toString("base64"),
    },
  }));
  parts.push({ text: BOLLETTA_PROMPT });

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: { parts },
    config: {
      systemInstruction: BOLLETTA_SYSTEM,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          fornitore: { type: Type.STRING, nullable: true },
          tipo_fornitura: { type: Type.STRING, nullable: true },
          consumo_annuo: { type: Type.NUMBER, nullable: true },
          unita_consumo: { type: Type.STRING, nullable: true },
          costo_materia_prima: { type: Type.NUMBER, nullable: true },
          spesa_annua_stimata: { type: Type.NUMBER, nullable: true },
          codice_pod: { type: Type.STRING, nullable: true },
          codice_pdr: { type: Type.STRING, nullable: true },
          risparmio_stimato_annuo: { type: Type.NUMBER, nullable: true },
          note: { type: Type.STRING, nullable: true },
        },
      },
    },
  });

  return parseJsonSafe(response.text);
}

export async function analyzeMacchinarioImage(
  data: Buffer,
  mimeType: string
): Promise<Record<string, any>> {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType,
            data: data.toString("base64"),
          },
        },
        { text: MACCHINARIO_PROMPT },
      ],
    },
    config: {
      systemInstruction: MACCHINARIO_SYSTEM,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          titolo_suggerito: { type: Type.STRING },
          categoria: { type: Type.STRING },
          stato_usura: { type: Type.STRING },
          descrizione_breve: { type: Type.STRING },
          tag_ricerca: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
      },
    },
  });

  return parseJsonSafe(response.text);
}
