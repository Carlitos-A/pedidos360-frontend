import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, interval } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { HealthService } from '../../services/health.service';
import {
  EvidenceService,
  ValidationCase,
  ValidationResult,
  tamperSignature,
} from '../../services/evidence.service';
import { decodeJwtPayload } from '../../core/auth/jwt';
import { HealthEntry } from '../../core/models/api.models';
import { Resource } from '../../shared/resource';
import { LoadStateComponent } from '../../shared/load-state.component';
import { LocalDatePipe } from '../../shared/format';
import { describeError } from '../../core/interceptors/api-error.interceptor';
import { environment } from '../../../environments/environment';
@Component({
  selector: 'app-evidence',
  imports: [FormsModule, LoadStateComponent, LocalDatePipe],
  templateUrl: './evidence.component.html',
})
export class EvidenceComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly healthService = inject(HealthService);
  private readonly service = inject(EvidenceService);
  private readonly destroyRef = inject(DestroyRef);
  private token = '';
  readonly tokenLoading = signal(false);
  readonly tokenError = signal('');
  readonly feedback = signal('');
  readonly health = new Resource<HealthEntry[]>([]);
  readonly now = signal(Date.now());
  readonly expires = computed(() => Number(this.auth.claims()['exp'] ?? 0) * 1000);
  readonly expiryText = computed(() => {
    if (!this.expires()) return 'Sin fecha de expiración';
    const seconds = Math.max(0, Math.floor((this.expires() - this.now()) / 1000));
    return seconds
      ? 'Expira en ' + Math.floor(seconds / 60) + ' min ' + (seconds % 60) + ' s'
      : 'Token expirado';
  });
  readonly claims = ['iss', 'aud', 'scp', 'roles', 'upn'];
  readonly cases: { kind: ValidationCase; label: string; expected: number }[] = [
    { kind: 'valid', label: 'Con token válido', expected: 200 },
    { kind: 'missing', label: 'Sin token', expected: 401 },
    { kind: 'tampered', label: 'Token alterado', expected: 401 },
    { kind: 'expired', label: 'Token expirado', expected: 401 },
  ];
  readonly results = signal<Partial<Record<ValidationCase, ValidationResult>>>({});
  readonly running = signal<ValidationCase | ''>('');
  readonly testError = signal('');
  expiredToken = '';
  readonly inspector = environment.jwtInspectorUrl;
  ngOnInit(): void {
    void this.loadToken();
    this.loadHealth();
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.now.set(Date.now()));
    this.destroyRef.onDestroy(() => {
      this.token = '';
      this.expiredToken = '';
    });
  }
  claim(key: string): string {
    const value = this.auth.claims()[key];
    return value == null ? 'No informado' : Array.isArray(value) ? value.join(', ') : String(value);
  }
  async loadToken(): Promise<void> {
    this.tokenLoading.set(true);
    this.tokenError.set('');
    this.token = '';
    try {
      this.token = await firstValueFrom(this.auth.getAccessToken());
      if (!this.token) throw new Error('No token');
    } catch {
      this.tokenError.set('No se pudo obtener el access token. Reintenta la consulta.');
    } finally {
      this.tokenLoading.set(false);
    }
  }
  loadHealth(): void {
    this.health.load(this.healthService.check());
  }
  async copyToken(): Promise<void> {
    this.feedback.set('');
    try {
      const token = await firstValueFrom(this.auth.getAccessToken());
      if (!token) throw new Error('No token');
      await navigator.clipboard.writeText(token);
      this.feedback.set('Token copiado al portapapeles.');
    } catch {
      this.feedback.set('No se pudo copiar el token. Comprueba el permiso del portapapeles.');
    }
  }
  async run(kind: ValidationCase): Promise<void> {
    if (this.running() || !this.auth.hasRole('Admin')) return;
    this.running.set(kind);
    this.testError.set('');
    try {
      let token = '';
      if (kind === 'expired') {
        token = this.expiredToken.trim() || this.token;
        const claims = decodeJwtPayload(token);
        if (
          !Number.isFinite(Number(claims['exp'])) ||
          Number(claims['exp']) * 1000 >= Date.now() ||
          !claims['exp']
        ) {
          this.testError.set(
            'Pega un access token realmente expirado. Cambiar su fecha manualmente invalidaría la firma.',
          );
          return;
        }
      } else if (kind !== 'missing') {
        token = await firstValueFrom(this.auth.getAccessToken());
        if (!token) throw new Error('No token');
        if (kind === 'tampered') token = tamperSignature(token);
      }
      const result = await firstValueFrom(this.service.run(kind, token));
      this.results.update((results) => ({ ...results, [kind]: result }));
      if (kind === 'expired') this.expiredToken = '';
    } catch (error) {
      this.testError.set(describeError(error));
    } finally {
      this.running.set('');
    }
  }
}
