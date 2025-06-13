import { useRef, useCallback, useEffect, useState } from 'react';

interface PoseKeypoint {
  x: number;
  y: number;
  z?: number;
  score?: number;
  name?: string;
}

interface PoseData {
  keypoints: PoseKeypoint[];
  timestamp: number;
  score?: number;
  exerciseMatch?: boolean;
  exerciseScore?: number;
}

interface UsePoseDetectionReturn {
  isLoading: boolean;
  error: string | null;
  startDetection: (exercise?: string) => Promise<void>;
  stopDetection: () => void;
  poseData: PoseData[];
  clearData: () => void;
}

export function usePoseDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>
): UsePoseDetectionReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [poseData, setPoseData] = useState<PoseData[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  
  const detectorRef = useRef<any>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const isDetectingRef = useRef<boolean>(false);
  const currentExerciseRef = useRef<string>('');

  const loadTensorFlow = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const tf = await import('@tensorflow/tfjs');
      
      const poseDetection = await import('@tensorflow-models/pose-detection');

      await tf.ready();

      const model = poseDetection.SupportedModels.MoveNet;
      const detectorConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      };
      
      const detector = await poseDetection.createDetector(model, detectorConfig);
      detectorRef.current = detector;
      
      setIsLoading(false);
    } catch (err) {
      console.error('❌ Error cargando TensorFlow.js:', err);
      setError('Error al cargar el sistema de detección de poses: ' + err);
      setIsLoading(false);
    }
  }, []);

  const drawKeypoints = useCallback((ctx: CanvasRenderingContext2D, keypoints: PoseKeypoint[]) => {
    keypoints.forEach((keypoint) => {
      if (keypoint.score && keypoint.score > 0.3) {
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#FF0000';
        ctx.fill();
      }
    });
  }, []);

  const drawSkeleton = useCallback((ctx: CanvasRenderingContext2D, keypoints: PoseKeypoint[]) => {
    const connections = [
      [5, 6], [5, 7], [7, 9], [6, 8], [8, 10], 
      [5, 11], [6, 12], [11, 12], 
      [11, 13], [13, 15], [12, 14], [14, 16], 
    ];

    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;

    connections.forEach(([i, j]) => {
      const kp1 = keypoints[i];
      const kp2 = keypoints[j];
      
      if (kp1?.score && kp2?.score && kp1.score > 0.3 && kp2.score > 0.3) {
        ctx.beginPath();
        ctx.moveTo(kp1.x, kp1.y);
        ctx.lineTo(kp2.x, kp2.y);
        ctx.stroke();
      }
    });
  }, []);

  const detectPose = useCallback(async () => {
    
    if (!videoRef.current || !canvasRef.current || !detectorRef.current) {
      return;
    }

    if (!isDetectingRef.current) {
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        setTimeout(() => {
          if (isDetectingRef.current) detectPose();
        }, 16); 
        return;
      }

      if (video.readyState < 2) {
        setTimeout(() => {
          if (isDetectingRef.current) detectPose();
        }, 16);
        return;
      }

      const videoWidth = video.videoWidth || 640;
      const videoHeight = video.videoHeight || 480;
      
      if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
        canvas.width = videoWidth;
        canvas.height = videoHeight;
      }

      const poses = await detectorRef.current.estimatePoses(video);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (poses.length > 0) {
        const pose = poses[0];
        
        const exerciseValidation = validateExercise(pose.keypoints, currentExerciseRef.current);
        
        if (exerciseValidation.isValid) {
          
          drawSkeleton(ctx, pose.keypoints);
          drawKeypoints(ctx, pose.keypoints);

          setPoseData(prev => {
            const newData = [...prev, {
              keypoints: pose.keypoints.map((kp: any) => ({
                x: kp.x,
                y: kp.y,
                score: kp.score,
                name: kp.name
              })),
              timestamp: Date.now(),
              score: pose.score,
              exerciseMatch: true,
              exerciseScore: exerciseValidation.score
            }];
            return newData;
          });
        } else {
          ctx.strokeStyle = '#FF6B6B'; 
          ctx.fillStyle = '#FF6B6B';
          drawSkeleton(ctx, pose.keypoints);
          drawKeypoints(ctx, pose.keypoints);
        }
      } 

      setTimeout(() => {
        if (isDetectingRef.current) detectPose();
      }, 16); 
      
    } catch (err) {
      console.error('❌ Error en detección de pose:', err);
      setTimeout(() => {
        if (isDetectingRef.current) detectPose();
      }, 100); 
    }
  }, [videoRef, canvasRef, drawKeypoints, drawSkeleton]); 

  const startDetection = useCallback(async (exercise: string = '') => {
    
    currentExerciseRef.current = exercise;
    
    if (!detectorRef.current) {
      await loadTensorFlow();
    }

    if (!videoRef.current || !detectorRef.current) {
      const errorMsg = 'Sistema de detección no disponible';
      console.error('❌', errorMsg);
      setError(errorMsg);
      return;
    }

    const video = videoRef.current;

    isDetectingRef.current = true;
    setIsDetecting(true);
    setPoseData([]);
    
    setTimeout(() => {
      detectPose();
    }, 100);

  }, [loadTensorFlow, videoRef, detectPose]);

  const stopDetection = useCallback(() => {
    isDetectingRef.current = false;
    setIsDetecting(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const clearData = useCallback(() => {
    setPoseData([]);
  }, []);

  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, [stopDetection]);

  return {
    isLoading,
    error,
    startDetection,
    stopDetection,
    poseData,
    clearData
  };
}


const validateFlexiones = (keypoints: PoseKeypoint[]): { isValid: boolean; score: number } => {
  
  const leftShoulder = keypoints[5];
  const rightShoulder = keypoints[6];
  const leftElbow = keypoints[7];
  const rightElbow = keypoints[8];
  const leftWrist = keypoints[9];
  const rightWrist = keypoints[10];
  const leftHip = keypoints[11];
  const rightHip = keypoints[12];

  
  const requiredKeypoints = [leftShoulder, rightShoulder, leftElbow, rightElbow, leftWrist, rightWrist, leftHip, rightHip];
  const validKeypoints = requiredKeypoints.filter(kp => kp && kp.score && kp.score > 0.5);
  
  if (validKeypoints.length < 6) {
    return { isValid: false, score: 0 };
  }

  let score = 0;
  let checks = 0;

  
  if (leftWrist && rightWrist && leftShoulder && rightShoulder) {
    const avgWristY = (leftWrist.y + rightWrist.y) / 2;
    const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    
    
    if (avgWristY > avgShoulderY) {
      score += 25;
    }
    checks++;
  }

  
  if (leftShoulder && rightShoulder && leftHip && rightHip) {
    const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;
    const hipCenterY = (leftHip.y + rightHip.y) / 2;
    
    
    const bodyAngle = Math.abs(shoulderCenterY - hipCenterY);
    if (bodyAngle < 100) { 
      score += 25;
    }
    checks++;
  }

  
  if (leftElbow && rightElbow && leftShoulder && rightShoulder) {
    const elbowShoulderDistance = Math.abs((leftElbow.y + rightElbow.y) / 2 - (leftShoulder.y + rightShoulder.y) / 2);
    if (elbowShoulderDistance < 80) {
      score += 25;
    }
    checks++;
  }

  
  if (leftShoulder && rightShoulder && leftHip && rightHip) {
    const shoulderLevel = Math.abs(leftShoulder.y - rightShoulder.y);
    const hipLevel = Math.abs(leftHip.y - rightHip.y);
    
    if (shoulderLevel < 50 && hipLevel < 50) {
      score += 25;
    }
    checks++;
  }

  const finalScore = checks > 0 ? score : 0;
  return { isValid: finalScore >= 50, score: finalScore };
};

const validateSentadilla = (keypoints: PoseKeypoint[]): { isValid: boolean; score: number } => {
  const leftHip = keypoints[11];
  const rightHip = keypoints[12];
  const leftKnee = keypoints[13];
  const rightKnee = keypoints[14];
  const leftAnkle = keypoints[15];
  const rightAnkle = keypoints[16];
  const leftShoulder = keypoints[5];
  const rightShoulder = keypoints[6];

  const requiredKeypoints = [leftHip, rightHip, leftKnee, rightKnee, leftAnkle, rightAnkle];
  const validKeypoints = requiredKeypoints.filter(kp => kp && kp.score && kp.score > 0.5);
  
  if (validKeypoints.length < 4) {
    return { isValid: false, score: 0 };
  }

  let score = 0;

  
  if (leftHip && leftKnee && leftAnkle) {
    const thighAngle = Math.atan2(leftKnee.y - leftHip.y, leftKnee.x - leftHip.x);
    const calfAngle = Math.atan2(leftAnkle.y - leftKnee.y, leftAnkle.x - leftKnee.x);
    const kneeAngle = Math.abs(thighAngle - calfAngle);
    
    if (kneeAngle > 0.5 && kneeAngle < 2.5) { 
      score += 30;
    }
  }

  
  if (leftShoulder && rightShoulder && leftHip && rightHip) {
    const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
    const hipCenterX = (leftHip.x + rightHip.x) / 2;
    
    if (Math.abs(shoulderCenterX - hipCenterX) < 50) {
      score += 35;
    }
  }

  
  if (leftShoulder && rightShoulder && leftHip && rightHip) {
    const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    const hipY = (leftHip.y + rightHip.y) / 2;
    
    if (hipY > shoulderY) {
      score += 35;
    }
  }

  return { isValid: score >= 60, score };
};

const validatePesoDuerto = (keypoints: PoseKeypoint[]): { isValid: boolean; score: number } => {
  
  const leftShoulder = keypoints[5];
  const rightShoulder = keypoints[6];
  const leftHip = keypoints[11];
  const rightHip = keypoints[12];
  const leftKnee = keypoints[13];
  const rightKnee = keypoints[14];

  let score = 0;

  
  if (leftShoulder && rightShoulder && leftHip && rightHip) {
    const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    const hipY = (leftHip.y + rightHip.y) / 2;
    const shoulderX = (leftShoulder.x + rightShoulder.x) / 2;
    const hipX = (leftHip.x + rightHip.x) / 2;
    
    
    if (shoulderX > hipX && shoulderY < hipY) {
      score += 50;
    }
  }

  
  if (leftHip && leftKnee && leftHip.y < leftKnee.y) {
    score += 25;
  }

  
  if (score >= 50) {
    score += 25;
  }

  return { isValid: score >= 50, score };
};

const validateExercise = (keypoints: PoseKeypoint[], exercise: string): { isValid: boolean; score: number } => {
  switch (exercise) {
    case 'flexiones':
      return validateFlexiones(keypoints);
    case 'sentadilla':
      return validateSentadilla(keypoints);
    case 'peso_muerto':
      return validatePesoDuerto(keypoints);
    case 'press_banca':
      
      return validateFlexiones(keypoints);
    case 'press_militar':
      
      return { isValid: true, score: 70 }; 
    case 'dominadas':
      
      return { isValid: true, score: 70 }; 
    default:
      return { isValid: true, score: 100 }; 
  }
}; 