import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';


const exerciseSchema = z.object({
  name: z.string().describe('Nombre del ejercicio en español'),
  sets: z.number().min(1).max(6).describe('Número de series'),
  reps: z.string().describe('Rango de repeticiones (ej: "8-12", "12-15")'),
  rest: z.string().describe('Tiempo de descanso específico en segundos (ej: "60", "90", "120")'),
  notes: z.string().optional().describe('Notas adicionales sobre técnica o variaciones'),
  muscleGroups: z.array(z.string()).describe('Grupos musculares trabajados'),
  difficulty: z.enum(['principiante', 'intermedio', 'avanzado']).describe('Nivel de dificultad')
});

const routineSchema = z.object({
  name: z.string().describe('Nombre de la rutina'),
  description: z.string().describe('Descripción breve de la rutina'),
  duration: z.string().describe('Duración estimada (ej: "45-60 min")'),
  difficulty: z.enum(['principiante', 'intermedio', 'avanzado']).describe('Nivel general'),
  goals: z.array(z.string()).describe('Objetivos principales'),
  exercises: z.array(exerciseSchema).describe('Lista de ejercicios'),
  warmup: z.array(z.string()).describe('Ejercicios de calentamiento'),
  cooldown: z.array(z.string()).describe('Ejercicios de enfriamiento'),
  tips: z.array(z.string()).describe('Consejos importantes para la rutina'),
  frequency: z.string().describe('Frecuencia recomendada por semana')
});

export async function POST(req: Request) {
  try {
    const { 
      goal, 
      experience, 
      timeAvailable, 
      equipment, 
      muscleGroups, 
      limitations,
      preferences 
    } = await req.json();

    const prompt = `Genera una rutina de entrenamiento personalizada basada en los siguientes parámetros:

🎯 OBJETIVO: ${goal}
📊 NIVEL: ${experience}
⏰ TIEMPO DISPONIBLE: ${timeAvailable} minutos
🏋️ EQUIPAMIENTO: ${equipment.join(', ')}
💪 GRUPOS MUSCULARES OBJETIVO: ${muscleGroups.join(', ')}
⚠️ LIMITACIONES: ${limitations || 'Ninguna'}
❤️ PREFERENCIAS: ${preferences || 'Ninguna'}

INSTRUCCIONES PARA LA RUTINA:
- Crea una rutina completa y balanceada
- Incluye calentamiento y enfriamiento apropiados
- Ajusta la intensidad al nivel de experiencia
- Considera el tiempo disponible para estructurar los ejercicios
- Incluye ejercicios que se puedan realizar con el equipamiento disponible
- Enfócate en los grupos musculares solicitados
- Respeta las limitaciones mencionadas
- Proporciona consejos de seguridad y técnica
- Incluye variaciones si es necesario
- Sugiere progresiones futuras

IMPORTANTE PARA TIEMPOS DE DESCANSO:
- Para ejercicios de fuerza/potencia: usa "120" segundos
- Para ejercicios de hipertrofia: usa "90" segundos  
- Para ejercicios de resistencia/circuitos: usa "60" segundos
- Para ejercicios de aislamiento: usa "60" segundos
- NO uses rangos como "60-90" o "90-120", solo números específicos
- Los valores deben ser: "30", "45", "60", "90", "120", "150", "180"

La rutina debe ser práctica, segura y efectiva para alcanzar los objetivos especificados.`;

    const result = await generateObject({
      model: google('gemini-2.0-flash'),
      prompt,
      schema: routineSchema,
    });

    return Response.json(result.object);
  } catch (error) {
    console.error('Error generating routine:', error);
    return Response.json(
      { error: 'Error al generar la rutina' },
      { status: 500 }
    );
  }
} 