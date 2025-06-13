export type Language = 'es' | 'en'

export type Translations = Record<string, any>

const translationsCache: Record<Language, Translations | null> = {
  es: null,
  en: null
}

const loadingPromises: Record<Language, Promise<Translations> | null> = {
  es: null,
  en: null
}

export async function loadTranslations(language: Language): Promise<Translations> {
  if (translationsCache[language]) {
    return translationsCache[language]!
  }

  if (loadingPromises[language]) {
    return loadingPromises[language]!
  }

  loadingPromises[language] = (async () => {
    try {
      const translations = await import(`../locales/${language}.json`)
      
      translationsCache[language] = translations.default
      
      return translations.default
    } catch (error) {
      console.error(`Error loading translations for language ${language}:`, error)
      
      if (language !== 'es') {
        return loadTranslations('es')
      }
      
      const fallback = getFallbackTranslations()
      translationsCache[language] = fallback
      return fallback
    } finally {
      loadingPromises[language] = null
    }
  })()

  return loadingPromises[language]!
}

function getFallbackTranslations(): Translations {
  return {
    nav: {
      routines: 'Rutinas',
      exercises: 'Ejercicios',
      history: 'Historial',
      dashboard: 'Dashboard'
    },
    common: {
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      create: 'Crear',
      add: 'Agregar',
      remove: 'Quitar',
      back: 'Volver',
      next: 'Siguiente',
      previous: 'Anterior',
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      confirm: 'Confirmar',
      yes: 'Sí',
      no: 'No',
      search: 'Buscar',
      filter: 'Filtrar',
      clear: 'Limpiar',
      all: 'Todos',
      none: 'Ninguno',
      done: 'Hecho',
      continue: 'Continuar',
      start: 'Comenzar',
      finish: 'Finalizar',
      complete: 'Completar',
      details: 'Detalles',
      notes: 'Notas',
      weight: 'Peso',
      reps: 'Reps',
      sets: 'Sets',
      exercise: 'Ejercicio',
      routine: 'Rutina',
      duration: 'Duración',
      progress: 'Progreso',
      total: 'Total',
      completed: 'Completado',
      inProgress: 'En Progreso',
      actions: 'Acciones',
      of: 'de',
      close: 'Cerrar',
      open: 'Abrir',
      view: 'Ver',
      update: 'Actualizar',
      kg: 'kg',
      exit: 'Salir',
      workout: 'Entrenamiento',
      active: 'Activo',
      updated: 'Actualizado',
      share: 'Compartir',
      copy: 'Copiar',
      code: 'Código',
      link: 'Enlace',
      retry: 'Reintentar',
      minutes: 'minutos',
      min: 'min',
      searching: 'Buscando',
      adding: 'Agregando',
      sharing: 'Compartiendo',
      copied: 'Copiado'
    },
    app: {
      title: 'DallaTrack - Tu Compañero de Entrenamiento',
      description: 'Rastrea tus entrenamientos, crea rutinas y monitorea tu progreso',
      name: 'DallaTrack'
    },
    sharing: {
      addSharedRoutine: {
        title: 'Agregar rutina compartida',
        routineCode: 'Código de rutina',
        codePlaceholder: 'Ejemplo: ABC123',
        searchButton: 'Buscar',
        searching: 'Buscando...',
        errorSearching: 'Error al buscar rutina',
        invalidCode: 'Código no válido',
        sharedBy: 'Compartida por',
        muscleGroups: 'Grupos musculares',
        exercises: 'Ejercicios',
        addToMyRoutines: 'Agregar a mis rutinas',
        adding: 'Agregando...',
        addedSuccessfully: 'Rutina agregada exitosamente',
        errorAdding: 'Error al agregar rutina',
        enterValidCode: 'Ingresa un código válido'
      },
      shareRoutine: {
        title: 'Compartir "{routineName}"',
        setExpiration: 'Establecer fecha de expiración',
        neverExpires: 'La rutina nunca expirará',
        daysToExpire: 'Días hasta expirar',
        setMaxUses: 'Establecer límite de usos',
        unlimitedUse: 'Uso ilimitado',
        maxUses: 'Número máximo de usos',
        shareRoutineButton: 'Compartir rutina',
        sharing: 'Compartiendo...',
        routineShared: '¡Rutina compartida!',
        shareDescription: 'Comparte este código o enlace para que otros puedan agregar tu rutina',
        routineCode: 'Código de rutina',
        directLink: 'Enlace directo',
        qrCode: 'Código QR',
        expiresIn: 'Expira en {days} días',
        noExpiration: 'Sin fecha de expiración',
        maxUsesLimit: 'Máximo {uses} usos',
        unlimitedUses: 'Usos ilimitados',
        errorSharing: 'Error al compartir rutina',
        sharedSuccessfully: 'Rutina compartida exitosamente',
        days: {
          '7': '7 días',
          '14': '14 días',
          '30': '30 días',
          '60': '60 días',
          '90': '90 días'
        },
        uses: {
          '5': '5 usos',
          '10': '10 usos',
          '25': '25 usos',
          '50': '50 usos',
          '100': '100 usos'
        }
      },
      statistics: {
        title: 'Estadísticas de Compartir',
        subtitle: 'Analiza el rendimiento de tus rutinas compartidas',
        backToRoutines: 'Volver a rutinas',
        sharedRoutines: 'Rutinas compartidas',
        totalUses: 'Usos totales',
        uniqueUsers: 'Usuarios únicos',
        thisWeek: 'Esta semana',
        usageByDays: 'Uso por días',
        usageTrend: 'Tendencia de uso de tus rutinas compartidas en los últimos 30 días',
        recentUses: 'Usos Recientes',
        recentUsesDescription: 'Últimos usos de tus rutinas compartidas',
        mySharedRoutines: 'Mis Rutinas Compartidas',
        mySharedRoutinesDescription: 'Gestiona tus rutinas compartidas y ve sus estadísticas',
        routine: 'Rutina',
        user: 'Usuario',
        date: 'Fecha',
        uses: 'Usos',
        status: 'Estado',
        active: 'Activa',
        inactive: 'Inactiva',
        statusUpdated: 'Estado actualizado',
        routineActivated: 'Rutina activada exitosamente',
        routineDeactivated: 'Rutina desactivada exitosamente',
        errorUpdatingStatus: 'Error al cambiar estado de la rutina',
        anonymousUser: 'Usuario anónimo',
        noRecentUses: 'No hay usos recientes',
        noSharedRoutines: 'No tienes rutinas compartidas',
        errorLoading: 'Error al cargar estadísticas',
        errorLoadingDescription: 'Error al cargar estadísticas',
        retryButton: 'Reintentar'
      },
      sharedRoutine: {
        title: 'Rutina Compartida',
        codeLabel: 'Código: {code}',
        sharedBy: 'Compartida por {name}',
        muscleGroups: 'Grupos musculares',
        exercisesCount: 'Ejercicios ({count})',
        addToMyRoutines: 'Agregar a mis rutinas',
        adding: 'Agregando...',
        backToRoutines: 'Volver a rutinas',
        loadingRoutine: 'Cargando rutina compartida...',
        invalidCode: 'Código de rutina no válido',
        invalidCodeDescription: 'El código que ingresaste no es válido o la rutina ya no está disponible',
        retry: 'Reintentar',
        goToMyRoutines: 'Ir a mis rutinas',
        addedSuccessfully: 'Rutina agregada exitosamente',
        errorAdding: 'Error al agregar rutina',
        sets: 'series',
        reps: 'repeticiones',
        rest: 'descanso',
        notes: 'Notas'
      }
    },
    dashboard: {
      welcome: 'Bienvenido a',
      quickActions: 'Acciones Rápidas',
      recentWorkouts: 'Entrenamientos Recientes',
      recentWorkoutsDescription: 'Tus últimas sesiones de entrenamiento',
      progressOverview: 'Resumen de Progreso',
      progressOverviewDescription: 'Tu viaje fitness de un vistazo',
      noRecentWorkouts: 'No hay entrenamientos recientes aún. Comienza a entrenar para ver tu historial aquí.',
      noProgressData: 'Comienza a rastrear tus entrenamientos para ver métricas de progreso aquí.',
      myRoutines: 'Mis Rutinas',
      thisWeek: 'Esta Semana',
      thisMonth: 'Este Mes',
      totalVolume: 'Volumen Total',
      kgLifted: 'kg levantados',
      setsCompleted: 'Sets completados',
      weeklyGoal: 'Meta semanal',
      workouts: 'entrenamientos',
      popularRoutines: 'Rutinas Populares',
      mostUsedRoutines: 'Tus rutinas más utilizadas',
      noRoutinesYet: 'No tienes rutinas aún',
      viewAllHistory: 'Ver todo el historial',
      viewAllRoutines: 'Ver todas las rutinas',
      addNewExercise: 'Agregar nuevo ejercicio',
      createNewRoutine: 'Crear nueva rutina',
      viewProgress: 'Ver Progreso',
      analyzeStats: 'Analizar estadísticas',
      times: 'veces',
      exercises: 'ejercicios',
      workout: 'Entrenamiento'
    },
    theme: {
      title: 'Tema',
      light: 'Claro',
      dark: 'Oscuro',
      system: 'Sistema',
      changeTheme: 'Cambiar tema'
    },
    history: {
      title: 'Historial',
      trainingHistory: 'Historial de Entrenamientos',
      errorLoading: 'Error al cargar',
      errorLoadingDescription: 'No se pudieron cargar las sesiones de entrenamiento.',
      sessionCount: 'sesión',
      workoutsCount: 'entrenamientos',
      filters: 'Filtros',
      clearFilters: 'Limpiar Filtros',
      year: 'Año',
      month: 'Mes',
      day: 'Día',
      allYears: 'Todos los años',
      allMonths: 'Todos los meses',
      allDays: 'Todos los días',
      completedSessions: 'Completados',
      setsPerformed: 'Sets realizados',
      totalTime: 'Tiempo total',
      noSessions: 'No hay entrenamientos aún',
      noSessionsDescription: 'Comienza tu primer entrenamiento para ver tu historial aquí.',
      noFilteredSessions: 'No hay entrenamientos para estos filtros',
      noFilteredSessionsDescription: 'Intenta ajustar los filtros para ver más resultados.',
      startedAgo: 'Iniciado hace',
      sessionNotFound: 'Sesión no encontrada',
      sessionNotFoundPage: 'La sesión de entrenamiento no pudo ser encontrada.',
      failedToLoadSession: 'Error al cargar detalles de la sesión.',
      workoutDetails: 'Detalles del Entrenamiento',
      trainingSession: 'Sesión de Entrenamiento',
      date: 'Fecha'
    },
    months: {
      january: 'Enero',
      february: 'Febrero',
      march: 'Marzo',
      april: 'Abril',
      may: 'Mayo',
      june: 'Junio',
      july: 'Julio',
      august: 'Agosto',
      september: 'Septiembre',
      october: 'Octubre',
      november: 'Noviembre',
      december: 'Diciembre'
    }
  }
}

export const getMonthName = (monthIndex: number, language: Language): string => {
  const monthKeys = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ] as const
  
  if (translationsCache[language]) {
    return translationsCache[language]!.months?.[monthKeys[monthIndex]] || monthKeys[monthIndex]
  }
  
  const fallback = getFallbackTranslations()
  return fallback.months?.[monthKeys[monthIndex]] || monthKeys[monthIndex]
}

export function getNestedTranslation(translations: Translations, path: string, fallback?: string): string {
  const keys = path.split('.')
  let current = translations
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key]
    } else {
      return fallback || path
    }
  }
  
  return typeof current === 'string' ? current : fallback || path
}

export function clearTranslationsCache() {
  translationsCache.es = null
  translationsCache.en = null
  loadingPromises.es = null
  loadingPromises.en = null
} 