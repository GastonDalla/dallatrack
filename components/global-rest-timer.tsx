"use client"

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Timer, X, Plus, ArrowRight } from 'lucide-react';
import { useRestTimer } from '@/contexts/RestTimerContext';
import { useTranslations } from '@/contexts/LanguageContext';

export function GlobalRestTimer() {
  const restTimer = useRestTimer();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();
  const [isMinimized, setIsMinimized] = useState(false);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!restTimer.isActive || !restTimer.sessionId) {
    return null;
  }

  const isInTrainingPage = pathname?.includes('/training/') || pathname?.includes('/dashboard/training');
  if (isInTrainingPage) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 fade-in-50">
      <Card className="border-amber-200 bg-amber-50/95 dark:border-amber-800 dark:bg-amber-950/95 backdrop-blur-sm shadow-lg max-w-sm">
        <CardContent className="p-3">
          {isMinimized ? (
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                {formatTime(restTimer.currentTime)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(false)}
                className="h-6 w-6 p-0 hover:bg-amber-100 dark:hover:bg-amber-900"
              >
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    {t.training.restTime}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMinimized(true)}
                    className="h-6 w-6 p-0 hover:bg-amber-100 dark:hover:bg-amber-900"
                  >
                    <ArrowRight className="h-3 w-3 rotate-180" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={restTimer.stopRestTimer}
                    className="h-6 w-6 p-0 hover:bg-amber-100 dark:hover:bg-amber-900"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                  {formatTime(restTimer.currentTime)}
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {t.training.restTimeRemaining}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => restTimer.addTime(30)}
                  className="flex-1 h-8 text-xs font-medium text-amber-800 dark:text-amber-200 border-amber-300 bg-white dark:bg-amber-950 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  +30s
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => restTimer.addTime(60)}
                  className="flex-1 h-8 text-xs font-medium text-amber-800 dark:text-amber-200 border-amber-300 bg-white dark:bg-amber-950 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  +1m
                </Button>
                <Button
                  size="sm"
                  onClick={restTimer.skipTimer}
                  className="flex-1 h-8 text-xs font-medium bg-red-600 hover:bg-red-700 text-black border border-red-600 hover:border-red-700 dark:bg-red-700 dark:hover:bg-red-800 dark:border-red-700 dark:hover:border-red-800 dark:text-black"
                >
                  {t.training.skip}
                </Button>
              </div>

            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 