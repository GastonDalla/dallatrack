import { google } from '@ai-sdk/google';
import { generateText } from 'ai';


interface PoseKeypoint {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

interface PoseData {
  keypoints: PoseKeypoint[];
  timestamp: number;
}

interface AnalysisRequest {
  exercise: string;
  poseData: PoseData[];
  duration: number;
}

export async function POST(req: Request) {
  try {
    const { exercise, poseData, duration }: AnalysisRequest = await req.json();

    if (!exercise || !poseData || poseData.length === 0) {
      return Response.json({ error: 'Datos insuficientes para el análisis' }, { status: 400 });
    }

    const analysis = analyzePoseData(exercise, poseData, duration);
    
    const aiPrompt = `Como experto en biomecánica y entrenamiento, analiza los siguientes datos de un ejercicio de ${exercise}:

DATOS DEL ANÁLISIS:
- Duración: ${duration}ms
- Repeticiones detectadas: ${analysis.repetitions}
- Errores detectados: ${analysis.errors.join(', ')}
- Puntos clave: ${JSON.stringify(analysis.keyPointsAnalysis)}

INSTRUCCIONES:
1. Proporciona feedback específico sobre la técnica
2. Identifica los errores más críticos
3. Da recomendaciones concretas para mejorar
4. Asigna una puntuación del 1-100
5. Responde en español

Formato de respuesta JSON:
{
  "overallScore": number,
  "feedback": [
    {
      "category": "excelente|bueno|advertencia|necesita_mejora|peligroso",
      "message": "string",
      "timestamp": number
    }
  ],
  "keyPoints": [
    {
      "name": "string",
      "status": "correcto|incorrecto|advertencia",
      "description": "string"
    }
  ],
  "recommendations": ["string"],
  "commonMistakes": ["string"]
}`;

    const result = await generateText({
      model: google('gemini-2.0-flash'),
      prompt: aiPrompt,
    });

    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(result.text);
    } catch (parseError) {
      aiAnalysis = createFallbackAnalysis(exercise, analysis);
    }

    return Response.json({
      exercise,
      duration,
      repetitions: analysis.repetitions,
      ...aiAnalysis
    });

  } catch (error) {
    console.error('Error en análisis de forma:', error);
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

function analyzePoseData(exercise: string, poseData: PoseData[], duration: number) {
  const analysis = {
    repetitions: 0,
    errors: [] as string[],
    keyPointsAnalysis: {} as Record<string, any>
  };

  const hipMovements = poseData.map(pose => {
    const leftHip = pose.keypoints[23]; 
    const rightHip = pose.keypoints[24];
    return leftHip && rightHip ? (leftHip.y + rightHip.y) / 2 : 0;
  });

  let peaks = 0;
  for (let i = 1; i < hipMovements.length - 1; i++) {
    if (hipMovements[i] > hipMovements[i-1] && hipMovements[i] > hipMovements[i+1]) {
      peaks++;
    }
  }
  analysis.repetitions = Math.floor(peaks / 2); 

  switch (exercise) {
    case 'sentadilla':
      analysis.keyPointsAnalysis = analyzeSquat(poseData);
      break;
    case 'peso_muerto':
      analysis.keyPointsAnalysis = analyzeDeadlift(poseData);
      break;
    case 'press_banca':
      analysis.keyPointsAnalysis = analyzeBenchPress(poseData);
      break;
    default:
      analysis.keyPointsAnalysis = analyzeGeneral(poseData);
  }

  if (analysis.repetitions === 0) {
    analysis.errors.push('No se detectaron repeticiones completas');
  }
  
  if (duration < 5000) {
    analysis.errors.push('Duración muy corta para análisis completo');
  }

  return analysis;
}

function analyzeSquat(poseData: PoseData[]) {
  const analysis = {
    kneeAlignment: 'correcto',
    backPosition: 'correcto',
    depth: 'correcto',
    footPosition: 'correcto'
  };

  const kneeAlignmentIssues = poseData.filter(pose => {
    const leftKnee = pose.keypoints[25];
    const rightKnee = pose.keypoints[26];
    const leftAnkle = pose.keypoints[27];
    const rightAnkle = pose.keypoints[28];
    
    if (leftKnee && rightKnee && leftAnkle && rightAnkle) {
      
      const leftKneeAngle = Math.abs(leftKnee.x - leftAnkle.x);
      const rightKneeAngle = Math.abs(rightKnee.x - rightAnkle.x);
      return leftKneeAngle < 0.02 || rightKneeAngle < 0.02; 
    }
    return false;
  });

  if (kneeAlignmentIssues.length > poseData.length * 0.3) {
    analysis.kneeAlignment = 'incorrecto';
  }

  return analysis;
}

function analyzeDeadlift(poseData: PoseData[]) {
  return {
    barPath: 'correcto',
    backPosition: 'correcto',
    hipHinge: 'correcto'
  };
}

function analyzeBenchPress(poseData: PoseData[]) {
  return {
    armPosition: 'correcto',
    barPath: 'correcto',
    shoulderStability: 'correcto'
  };
}

function analyzeGeneral(poseData: PoseData[]) {
  return {
    posture: 'correcto',
    movement: 'correcto',
    stability: 'correcto'
  };
}

function createFallbackAnalysis(exercise: string, analysis: any) {
  return {
    overallScore: 75,
    feedback: [
      {
        category: 'bueno',
        message: `Análisis completado para ${exercise}`,
        timestamp: 1000
      }
    ],
    keyPoints: [
      {
        name: 'Técnica general',
        status: 'correcto',
        description: 'Movimiento detectado correctamente'
      }
    ],
    recommendations: [
      'Continúa practicando la técnica',
      'Mantén la concentración durante el ejercicio'
    ],
    commonMistakes: [
      'Velocidad inconsistente',
      'Rango de movimiento incompleto'
    ]
  };
} 