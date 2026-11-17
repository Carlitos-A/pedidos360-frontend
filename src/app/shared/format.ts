import { Pipe, PipeTransform } from '@angular/core';
@Pipe({ name: 'clp' })
export class ClpPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return value == null || !Number.isFinite(value)
      ? 'No disponible'
      : '$' + new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(value);
  }
}
@Pipe({ name: 'localDate' })
export class LocalDatePipe implements PipeTransform {
  transform(value: string | number | null | undefined, time = false): string {
    if (!value) return 'Sin fecha';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Sin fecha';
    const day = new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Santiago',
    })
      .format(date)
      .replaceAll('/', '-');
    return time
      ? day +
          ' ' +
          new Intl.DateTimeFormat('es-CL', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'America/Santiago',
          }).format(date)
      : day;
  }
}
export function numberLabel(value: number | null | undefined, suffix = ''): string {
  return value == null || !Number.isFinite(value)
    ? 'No disponible'
    : new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 }).format(value) + suffix;
}
