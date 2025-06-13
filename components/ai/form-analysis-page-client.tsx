"use client"

import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { $fetch } from "ofetch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePoseDetection } from "@/hooks/usePoseDetection";
import { Html5QrcodeScanner, Html5Qrcode } from "html5-qrcode";
import { 
  Camera, 
  Video, 
  Square,
  CheckCircle,
  AlertTriangle,
  Target,
  Eye,
  RotateCcw,
  Settings,
  Play,
  Pause,
  Download,
  Share2,
  Loader2
} from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from '@/contexts/LanguageContext';

interface FormAnalysis {
  exercise: string;
  overallScore: number;
  feedback: {
    category: 'excelente' | 'bueno' | 'advertencia' | 'necesita_mejora' | 'peligroso';
    message: string;
    timestamp: number;
  }[];
  keyPoints: {
    name: string;
    status: 'correcto' | 'incorrecto' | 'advertencia';
    description: string;
  }[];
  recommendations: string[];
  commonMistakes: string[];
  repetitions?: number;
  duration?: number;
}

const exercises = [
  { value: 'sentadilla', label: 'Sentadilla' },
  { value: 'press_banca', label: 'Press de Banca' },
  { value: 'peso_muerto', label: 'Peso Muerto' },
  { value: 'press_militar', label: 'Press Militar' },
  { value: 'dominadas', label: 'Dominadas' },
  { value: 'flexiones', label: 'Flexiones' }
];

export function FormAnalysisPageClient() {
  const t = useTranslations();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraContainerRef = useRef<HTMLDivElement>(null);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [analysis, setAnalysis] = useState<FormAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [realtimeFeedback, setRealtimeFeedback] = useState<FormAnalysis['feedback']>([]);
  const [analysisStartTime, setAnalysisStartTime] = useState<number>(0);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraDevices, setCameraDevices] = useState<any[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const {
    isLoading: isPoseLoading,
    error: poseError,
    startDetection,
    stopDetection,
    poseData,
    clearData
  } = usePoseDetection(videoRef, canvasRef);

  const analyzeFormMutation = useMutation({
    mutationFn: async (data: { exercise: string; poseData: any[]; duration: number }) => {
      const response = await $fetch<FormAnalysis>('/api/form-analysis', {
        method: 'POST',
        body: data,
      });
      return response;
    },
    onSuccess: (result) => {
      setAnalysis(result);
    },
    onError: (error: any) => {
      const errorMessage = error?.data?.message || error?.message || 'Error al analizar la forma. Inténtalo de nuevo.';
      console.error('Error analizando forma:', error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      #camera-container video {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
        border-radius: 8px !important;
      }
      
      #camera-container #qr-shaded-region,
      #camera-container #qr-scan-region,
      #camera-container [id*="qr-"]:not(video) {
        display: none !important;
      }
      
      #camera-container {
        background: #000 !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const getCameraDevices = useCallback(async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      setCameraDevices(devices);
      if (devices.length > 0) {
        setSelectedCamera(devices[0].id);
      }
      return devices;
    } catch (error) {
      console.error('Error obteniendo cámaras:', error);
      setCameraError('No se pudieron obtener las cámaras disponibles');
      return [];
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      setIsCameraReady(false);

      if (!cameraContainerRef.current) {
        throw new Error('Contenedor de cámara no disponible');
      }

      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
        } catch (e) {
          console.warn('Error deteniendo cámara anterior:', e);
        }
      }

      const html5QrCode = new Html5Qrcode("camera-container");
      html5QrCodeRef.current = html5QrCode;

      let devices = cameraDevices;
      if (devices.length === 0) {
        devices = await getCameraDevices();
      }

      if (devices.length === 0) {
        throw new Error('No se encontraron cámaras en el dispositivo');
      }

      const cameraId = selectedCamera || devices[0].id;

      const config = {
        fps: 30,
        qrbox: { width: 640, height: 480 },
        aspectRatio: 4/3,
        disableFlip: false,
        videoConstraints: {
          facingMode: "user" 
        }
      };

      await html5QrCode.start(
        cameraId,
        config,
        (decodedText, decodedResult) => {
        },
        (errorMessage) => {
        }
      );

      setTimeout(() => {
        const videoElement = cameraContainerRef.current?.querySelector('video');
        if (videoElement) {
          videoElement.style.width = '100%';
          videoElement.style.height = '100%';
          videoElement.style.objectFit = 'cover';
          videoElement.style.transform = 'scaleX(-1)'; 
          videoElement.style.borderRadius = '8px';
          
          const qrShaded = cameraContainerRef.current?.querySelector('#qr-shaded-region');
          if (qrShaded) {
            (qrShaded as HTMLElement).style.display = 'none';
          }
          
          const scanRegion = cameraContainerRef.current?.querySelector('#qr-scan-region');
          if (scanRegion) {
            (scanRegion as HTMLElement).style.display = 'none';
          }
          
          const overlays = cameraContainerRef.current?.querySelectorAll('[id*="qr"]');
          overlays?.forEach(overlay => {
            if (overlay !== videoElement) {
              (overlay as HTMLElement).style.display = 'none';
            }
          });
          
          if (videoRef.current) {
            videoRef.current.srcObject = (videoElement as any).srcObject;
            videoRef.current.width = videoElement.videoWidth || 640;
            videoRef.current.height = videoElement.videoHeight || 480;
            
            videoRef.current.play().then(() => {
              
              if (canvasRef.current) {
                canvasRef.current.width = videoElement.videoWidth || 640;
                canvasRef.current.height = videoElement.videoHeight || 480;
              }
            }).catch(err => {
              console.error('Error reproduciendo video de referencia:', err);
            });
          }
          
          setIsCameraReady(true);
        } else {
          throw new Error('No se pudo encontrar el elemento video');
        }
      }, 1500); 

    } catch (error: any) {
      console.error('Error iniciando cámara:', error);
      setCameraError(error.message || 'Error desconocido al iniciar la cámara');
      setIsCameraReady(false);
    }
  }, [selectedCamera, cameraDevices, getCameraDevices]);

  const stopCamera = useCallback(async () => {
    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
      }
      setIsCameraReady(false);
      setIsAnalyzing(false);
      stopDetection();
    } catch (error) {
      console.error('Error deteniendo cámara:', error);
    }
  }, [stopDetection]);

  useEffect(() => {
    getCameraDevices();
  }, [getCameraDevices]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && videoRef.current) {
      const url = URL.createObjectURL(file);
      videoRef.current.src = url;
      videoRef.current.onloadedmetadata = () => {
        if (videoRef.current) {
          videoRef.current.play();
          setIsCameraReady(true);
        }
      };
      setShowFileUpload(false);
    }
  };

  const startAnalysis = async () => {
    if (!selectedExercise) {
      alert('Por favor selecciona un ejercicio primero');
      return;
    }
    
    if (!isCameraReady) {
      alert('La cámara no está lista. Intenta activar la cámara o cargar un video.');
      return;
    }
    
    setIsAnalyzing(true);
    setRealtimeFeedback([]);
    setAnalysis(null);
    setAnalysisStartTime(Date.now());
    clearData();
    
    try {
      await startDetection(selectedExercise);
    } catch (error) {
      console.error('❌ Error iniciando análisis:', error);
      setIsAnalyzing(false);
      alert('Error al iniciar el análisis: ' + error);
    }
  };

  const stopAnalysis = async () => {
    setIsAnalyzing(false);
    stopDetection();
    
    if (poseData.length === 0) {
      toast({
        title: "Error",
        description: 'No se detectaron datos suficientes para el análisis',
        variant: "destructive"
      });
      return;
    }

    const duration = Date.now() - analysisStartTime;
    
    analyzeFormMutation.mutate({
      exercise: selectedExercise,
      poseData: poseData,
      duration: duration
    });
  };

  useEffect(() => {
    if (poseData.length > 0 && isAnalyzing) {
      const latestPose = poseData[poseData.length - 1];
      const timeElapsed = Date.now() - analysisStartTime;
      let feedbackMessage = '';
      let category: FormAnalysis['feedback'][0]['category'] = 'bueno';
      
      if (latestPose.exerciseMatch) {
        const exerciseScore = latestPose.exerciseScore || 0;
        if (exerciseScore >= 80) {
          feedbackMessage = `¡Excelente ${selectedExercise}! (${exerciseScore}%)`;
          category = 'excelente';
        } else if (exerciseScore >= 60) {
          feedbackMessage = `Buena técnica de ${selectedExercise} (${exerciseScore}%)`;
          category = 'bueno';
        } else {
          feedbackMessage = `${selectedExercise} detectada, mejora la forma (${exerciseScore}%)`;
          category = 'advertencia';
        }
      } else {
        feedbackMessage = `Pose no válida para ${selectedExercise}. Ajusta tu posición.`;
        category = 'necesita_mejora';
      }

      if (timeElapsed % 2000 < 100) {
        setRealtimeFeedback(prev => [...prev, {
          category,
          message: feedbackMessage,
          timestamp: timeElapsed
        }]);
      }
    }
  }, [poseData, isAnalyzing, analysisStartTime, selectedExercise]);

  const getFeedbackColor = (category: string) => {
    switch (category) {
      case 'excelente': return 'text-green-600 bg-green-50';
      case 'bueno': return 'text-blue-600 bg-blue-50';
      case 'advertencia': return 'text-yellow-600 bg-yellow-50';
      case 'necesita_mejora': return 'text-orange-600 bg-orange-50';
      case 'peligroso': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'correcto': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'advertencia': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'incorrecto': return <Target className="h-4 w-4 text-red-500" />;
      default: return <Eye className="h-4 w-4 text-gray-500" />;
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="container mx-auto px-4 py-6 lg:py-8 max-w-7xl mb-16 md:mb-0">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-red-500 rounded-lg">
            <Camera className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold">{t.formAnalysis.title}</h1>
        </div>
        <p className="text-muted-foreground">
          {t.formAnalysis.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Panel de Cámara */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                {t.formAnalysis.cameraAnalysis}
                {isPoseLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Configuración */}
              <div className="space-y-4 mb-4">
                {/* Estado de la cámara */}
                {cameraError && (
                  <div className="p-3 rounded-lg border bg-red-50 border-red-200 text-red-800">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">{t.formAnalysis.cameraError} {cameraError}</span>
                    </div>
                  </div>
                )}

                {isCameraReady && (
                  <div className="p-3 rounded-lg border bg-green-50 border-green-200 text-green-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">{t.formAnalysis.cameraReady}</span>
                    </div>
                  </div>
                )}

                {/* Selector de cámara */}
                {cameraDevices.length > 1 && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t.formAnalysis.camera}</label>
                    <Select value={selectedCamera} onValueChange={setSelectedCamera}>
                      <SelectTrigger>
                        <SelectValue placeholder={t.formAnalysis.selectCamera} />
                      </SelectTrigger>
                      <SelectContent>
                        {cameraDevices.map((device) => (
                          <SelectItem key={device.id} value={device.id}>
                            {device.label || `Cámara ${device.id.substring(0, 10)}...`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-2 block">{t.formAnalysis.exerciseToAnalyze}</label>
                  <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                    <SelectTrigger>
                      <SelectValue placeholder={t.formAnalysis.selectExercise} />
                    </SelectTrigger>
                    <SelectContent>
                      {exercises.map((exercise) => (
                        <SelectItem key={exercise.value} value={exercise.value}>
                          {exercise.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Video Feed */}
              <div className="relative bg-black rounded-lg overflow-hidden mb-4">
                {/* Contenedor para html5-qrcode */}
                <div 
                  id="camera-container" 
                  ref={cameraContainerRef}
                  className="w-full h-64"
                  style={{
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                />
                
                {/* Video oculto para pose detection */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="hidden"
                />
                
                {/* Canvas para dibujar poses */}
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-64 object-cover pointer-events-none"
                  style={{ display: isCameraReady ? 'block' : 'none' }}
                />
                
                {/* Placeholder cuando no hay cámara */}
                {!isCameraReady && (
                  <div className="w-full h-64 flex items-center justify-center bg-gray-800 text-white">
                    <div className="text-center">
                      <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{t.formAnalysis.activateCameraToStart}</p>
                    </div>
                  </div>
                )}
                
                {/* Overlay de estado */}
                <div className="absolute top-4 left-4 z-10">
                  {isAnalyzing && (
                    <Badge className="bg-red-500 animate-pulse">
                      <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                      {t.formAnalysis.analyzing} ({poseData.length} {t.formAnalysis.posesDetected})
                    </Badge>
                  )}
                  {poseError && (
                    <Badge variant="destructive">
                      {t.formAnalysis.error} {poseError}
                    </Badge>
                  )}
                </div>

                {/* Feedback en tiempo real */}
                {isAnalyzing && realtimeFeedback.length > 0 && (
                  <div className="absolute bottom-4 left-4 right-4 z-10">
                    <div className={`p-2 rounded-lg ${getFeedbackColor(realtimeFeedback[realtimeFeedback.length - 1].category)}`}>
                      <p className="text-sm font-medium">
                        {realtimeFeedback[realtimeFeedback.length - 1].message}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Controles */}
              <div className="flex gap-2">
                {!isCameraReady ? (
                  <>
                    <Button 
                      onClick={startCamera} 
                      className="flex-1"
                      disabled={cameraDevices.length === 0}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      {cameraDevices.length > 0 ? t.formAnalysis.activateCamera : t.formAnalysis.searchingCameras}
                    </Button>
                    
                    {/* Botón alternativo para cargar video */}
                    <Button 
                      onClick={() => setShowFileUpload(!showFileUpload)} 
                      variant="outline"
                      className="flex-shrink-0"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      {t.formAnalysis.video}
                    </Button>
                  </>
                ) : (
                  <>
                    {!isAnalyzing ? (
                      <>
                        <Button 
                          onClick={startAnalysis} 
                          className="flex-1"
                          disabled={!selectedExercise || isPoseLoading}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {t.formAnalysis.startAnalysis}
                        </Button>
                        
                        {/* Botón de test */}
                        <Button 
                          onClick={async () => {
                            
                            if (!videoRef.current) {
                              alert('❌ Video no disponible');
                              return;
                            }
                            
                            if (!selectedExercise) {
                              alert('❌ Selecciona un ejercicio primero');
                              return;
                            }

                            
                            try {
                              await startDetection(selectedExercise);
                              
                              setTimeout(() => {
                                stopDetection();
                                alert(`Test completado!\nPoses válidas de ${selectedExercise}: ${poseData.filter(p => p.exerciseMatch).length}\nTotal poses: ${poseData.length}`);
                              }, 10000);
                            } catch (error) {
                              console.error('❌ Test falló:', error);
                              alert('❌ Test falló: ' + error);
                            }
                          }}
                          variant="outline"
                          size="sm"
                          disabled={isPoseLoading || !selectedExercise}
                        >
                          {isPoseLoading ? t.common.loading : `${t.formAnalysis.test} ${selectedExercise || 'ejercicio'}`}
                        </Button>
                      </>
                    ) : (
                      <Button 
                        onClick={stopAnalysis} 
                        variant="destructive" 
                        className="flex-1"
                      >
                        <Square className="h-4 w-4 mr-2" />
                        {t.formAnalysis.stopAndAnalyze}
                      </Button>
                    )}
                    <Button onClick={stopCamera} variant="outline">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>

              {/* Input de archivo oculto */}
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />

              {/* Opciones de carga de archivo */}
              {showFileUpload && (
                <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-medium mb-2">{t.formAnalysis.loadVideoFromFile}</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t.formAnalysis.loadVideoDescription}
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="flex-1"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      {t.formAnalysis.selectVideo}
                    </Button>
                    <Button 
                      onClick={() => setShowFileUpload(false)}
                      variant="ghost"
                      size="sm"
                    >
                      {t.common.cancel}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feedback en Tiempo Real */}
          {realtimeFeedback.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-500" />
                  {t.formAnalysis.realtimeFeedback}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {realtimeFeedback.map((item, index) => (
                    <div key={index} className={`p-2 rounded-lg ${getFeedbackColor(item.category)}`}>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{item.message}</p>
                        <span className="text-xs opacity-70">
                          {Math.floor(item.timestamp / 1000)}s
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Panel de Resultados */}
        <div className="space-y-6">
          {analysis ? (
            <>
              {/* Puntuación General */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-500" />
                      {t.formAnalysis.completeAnalysis}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        {t.formAnalysis.export}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share2 className="h-4 w-4 mr-2" />
                        {t.formAnalysis.share}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold mb-2">{analysis.overallScore}/100</div>
                    <p className="text-muted-foreground">{t.formAnalysis.techniqueScore}</p>
                    {analysis.repetitions && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {analysis.repetitions} {t.formAnalysis.repetitionsDetected}
                      </p>
                    )}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${analysis.overallScore}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>

              {/* Puntos Clave */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-500" />
                    {t.formAnalysis.keyPointsAnalysis}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.keyPoints.map((point, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                        {getStatusIcon(point.status)}
                        <div className="flex-1">
                          <h4 className="font-medium">{point.name}</h4>
                          <p className="text-sm text-muted-foreground">{point.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recomendaciones */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-500" />
                    {t.formAnalysis.recommendations}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Errores Comunes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    {t.formAnalysis.detectedErrors}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.commonMistakes.map((mistake, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{mistake}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="h-96 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-2">{t.formAnalysis.selectExerciseFirst}</p>
                <p className="text-sm">{t.formAnalysis.analysisWillStart}</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Información adicional */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-500" />
            {t.formAnalysis.analysisImprovement}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">{t.formAnalysis.usingLibrary}</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>{t.formAnalysis.ultraCompatible}</li>
                <li>{t.formAnalysis.robust}</li>
                <li>{t.formAnalysis.multipleCameras}</li>
                <li>{t.formAnalysis.noComplexPermissions}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">{t.formAnalysis.mobileDevices}</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>{t.formAnalysis.worksAnyBrowser}</li>
                <li>{t.formAnalysis.allowsAccess}</li>
                <li>{t.formAnalysis.autoDetectCameras}</li>
                <li>{t.formAnalysis.optimizedMobile}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">{t.formAnalysis.features}</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>{t.formAnalysis.autoDetection}</li>
                <li>{t.formAnalysis.cameraSelector}</li>
                <li>{t.formAnalysis.videoUploadAlternative}</li>
                <li>{t.formAnalysis.clearIndicators}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 