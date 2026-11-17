import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuditService } from '../../services/audit.service';
import { AUDIT_TYPES, AuditEvent, AuditFilters } from '../../core/models/api.models';
import { describeError } from '../../core/interceptors/api-error.interceptor';
import { LocalDatePipe } from '../../shared/format';
@Component({
  selector: 'app-audit',
  imports: [FormsModule, LocalDatePipe],
  template: `
    <div class="page-heading">
      <div>
        <p class="eyebrow">TRAZABILIDAD</p>
        <h1>Auditoría</h1>
        <p class="muted">Consulta los eventos y cambios registrados en el sistema.</p>
      </div>
    </div>
    <section class="card">
      <h2>Auditoría de eventos</h2>
      <p class="muted">Actividad ordenada desde la más reciente.</p>
      <form class="filters" (ngSubmit)="apply()">
        <label
          >Usuario<input name="user" [(ngModel)]="filters.user" placeholder="correo@dominio.cl"
        /></label>
        <label
          >Tipo de evento<select name="type" [(ngModel)]="filters.type">
            <option value="">Todos</option>
            @for (type of types; track type) {
              <option [value]="type">{{ type }}</option>
            }
          </select></label
        >
        <label>Desde<input type="date" name="from" [(ngModel)]="filters.from" /></label>
        <label
          >Hasta<input
            type="date"
            name="to"
            [(ngModel)]="filters.to"
            [min]="filters.from || ''" /></label
        ><button>Aplicar filtros</button>
      </form>
      @if (filterError) {
        <p class="error" role="alert">{{ filterError }}</p>
      }
      @if (error()) {
        <div class="error" role="alert">
          {{ error() }} <button class="secondary compact" (click)="load()">Reintentar</button>
        </div>
      }
      @if (loading()) {
        <div class="loading" role="status">Cargando eventos…</div>
      }
      @if (!loading() && !error() && !events().length) {
        <p class="empty">No hay eventos con estos filtros.</p>
      }
      <ol class="timeline">
        @for (event of events(); track event.id) {
          <li>
            <div class="timeline-row">
              <div>
                <span class="event-type">{{ event.type }}</span
                ><span class="small">{{ event.description }}</span>
                <p class="muted">por {{ event.actorEmail || 'Sistema' }}</p>
              </div>
              <time class="small muted nowrap" [attr.datetime]="event.occurredAt">{{
                event.occurredAt | localDate: true
              }}</time>
            </div>
          </li>
        }
      </ol>
      @if (events().length) {
        <div class="pagination">
          <span>Mostrando {{ events().length }} de {{ total() }} eventos</span>
          @if (hasMore()) {
            <button class="secondary" [disabled]="loading()" (click)="load()">
              {{ loading() ? 'Cargando…' : 'Cargar más' }}
            </button>
          }
        </div>
      }
    </section>
  `,
})
export class AuditComponent implements OnInit {
  private readonly service = inject(AuditService);
  private readonly destroyRef = inject(DestroyRef);
  private request?: Subscription;
  readonly events = signal<AuditEvent[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly hasMore = signal(false);
  readonly types = AUDIT_TYPES;
  filters: AuditFilters = { user: '', type: '', from: '', to: '' };
  private applied: AuditFilters = {};
  private page = 0;
  filterError = '';
  ngOnInit(): void {
    this.apply();
  }
  apply(): void {
    if (this.filters.from && this.filters.to && this.filters.from > this.filters.to) {
      this.filterError = 'La fecha inicial debe ser anterior a la final.';
      return;
    }
    this.filterError = '';
    this.request?.unsubscribe();
    this.applied = { ...this.filters };
    this.page = 0;
    this.events.set([]);
    this.total.set(0);
    this.hasMore.set(false);
    this.load();
  }
  load(): void {
    this.request?.unsubscribe();
    this.loading.set(true);
    this.error.set('');
    this.request = this.service
      .list({ ...this.applied, page: this.page, pageSize: 20 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.events.update((events) =>
            Array.from(
              new Map([...events, ...result.items].map((event) => [event.id, event])).values(),
            ),
          );
          this.total.set(result.total);
          this.page = result.page + 1;
          this.hasMore.set(this.page * result.pageSize < result.total);
          this.loading.set(false);
        },
        error: (error) => {
          this.error.set(describeError(error));
          this.loading.set(false);
        },
      });
  }
}
