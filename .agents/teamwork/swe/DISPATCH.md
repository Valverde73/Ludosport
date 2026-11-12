## 2026-11-12T11:12:40Z

This is a single self-contained fix; keep it small and focused. En los combates, deshabilitar los botones de incremento (+) y decremento (-) de puntos mientras el cronómetro esté corriendo, habilitándolos únicamente cuando el cronómetro se detenga o pause para registrar las anotaciones.

Integrity mode: development

## Requirements

### R1. Deshabilitación de botones de puntuación durante el cronómetro activo
Cuando se inicie o reanude el cronómetro del combate, los botones de incremento (+) y decremento (-) de puntos de los combatientes deben quedar deshabilitados para evitar anotaciones mientras el tiempo está en marcha.

### R2. Habilitación de botones de puntuación con el cronómetro detenido
Cuando el cronómetro se detenga o pause (por ejemplo, tras una parada de combate o llamada de OH), los botones de incremento (+) y decremento (-) de puntos deben habilitarse de inmediato para permitir anotar los puntos antes de reanudar el tiempo.

## Acceptance Criteria

### Estado de controles según el cronómetro
- [ ] Los botones de + y - de puntuación están deshabilitados mientras el cronómetro del combate esté corriendo.
- [ ] Los botones de + y - de puntuación se habilitan cuando el cronómetro se detiene o pausa.
- [ ] Reanudar el cronómetro vuelve a deshabilitar inmediatamente los botones de + y -.
- [ ] El flujo existente de puntuación y cronometraje funciona correctamente cuando el cronómetro está detenido.
- [ ] Se añaden o actualizan pruebas automatizadas que verifiquen el estado deshabilitado/habilitado de los botones según el estado del cronómetro.
