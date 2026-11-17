import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  BehaviorSubject,
  catchError,
  exhaustMap,
  finalize,
  forkJoin,
  of,
  switchMap,
  tap,
  timeout,
  timer,
} from 'rxjs';
import { Kpis, LeadTimePoint, SalesPoint, TopProduct } from '../../core/models/api.models';
import { ReportsService } from '../../services/reports.service';
import { describeError } from '../../core/interceptors/api-error.interceptor';
import { ClpPipe, LocalDatePipe, numberLabel } from '../../shared/format';
import { SalesChartComponent } from './sales-chart.component';
import { LeadTimeChartComponent } from './lead-time-chart.component';
import { TopProductsChartComponent } from './top-products-chart.component';
import { environment } from '../../../environments/environment';
interface ReportData {
  kpis: Kpis;
  sales: SalesPoint[];
  leadTime: LeadTimePoint[];
  topProducts: TopProduct[];
}
@Component({
  selector: 'app-reports',
  imports: [
    FormsModule,
    ClpPipe,
    LocalDatePipe,
    SalesChartComponent,
    LeadTimeChartComponent,
    TopProductsChartComponent,
  ],
  template: `
    <div class="page-heading">
      <div>
        <p class="eyebrow">RESULTADOS DEL NEGOCIO</p>
        <h1>Reportería y KPIs</h1>
        <p class="muted">Ventas, tiempos de entrega y productos destacados.</p>
      </div>
      <div class="toolbar">
        <span [class]="error() ? 'live paused' : 'live'">{{
          error() ? '● Sin conexión' : loading() ? '● Actualizando…' : '● En vivo'
        }}</span>
        <label
          ><span class="visually-hidden">Rango de reportes</span
          ><select [ngModel]="days" (ngModelChange)="changeRange($event)">
            <option [ngValue]="7">Últimos 7 días</option>
            <option [ngValue]="30">Últimos 30 días</option>
            <option [ngValue]="90">Últimos 90 días</option>
            <option [ngValue]="365">Últimos 12 meses</option>
          </select></label
        >
      </div>
    </div>
    @if (error()) {
      <div class="error" role="alert">
        {{ error() }}
        @if (data()) {
          Se conservan los últimos datos recibidos.
        }
        <button class="secondary compact" (click)="refresh()">Reintentar</button>
      </div>
    }
    @if (loading() && !data()) {
      <div class="card loading" role="status">Cargando reportes…</div>
    }
    @if (data(); as report) {
      <div class="stack">
        <div class="equal-columns">
          <section class="card">
            <h2>Ventas</h2>
            <p class="muted">CLP por mes · período seleccionado</p>
            <app-sales-chart [data]="report.sales" />
          </section>
          <section class="card">
            <h2>Lead time</h2>
            <p class="muted">Días desde CREATED hasta COMPLETED</p>
            <app-lead-time-chart [data]="report.leadTime" />
          </section>
        </div>
        <div class="equal-columns">
          <section class="card">
            <h2>Top productos</h2>
            <p class="muted">Unidades vendidas en el período</p>
            <app-top-products-chart [data]="report.topProducts" />
          </section>
          <section class="card">
            <h2>Resumen</h2>
            <p class="muted">KPIs consolidados</p>
            <dl class="detail-list">
              <dt>Ventas totales ({{ days }} d)</dt>
              <dd>
                <strong>{{ report.kpis.totalSales | clp }}</strong>
              </dd>
              <dt>Ticket promedio</dt>
              <dd>
                <strong>{{ report.kpis.averageOrderValue | clp }}</strong>
              </dd>
              <dt>Tasa de cancelación</dt>
              <dd>
                <strong>{{
                  number(
                    report.kpis.cancellationRate == null
                      ? null
                      : report.kpis.cancellationRate * 100,
                    '%'
                  )
                }}</strong>
              </dd>
              <dt>Pedidos completados</dt>
              <dd>
                <strong>{{ number(report.kpis.completedOrders) }}</strong>
              </dd>
              <dt>Datos actualizados</dt>
              <dd>
                {{
                  report.kpis.updatedAt ? (report.kpis.updatedAt | localDate: true) : 'No informado'
                }}
              </dd>
            </dl>
          </section>
        </div>
      </div>
    }
    @if (lastSuccess()) {
      <p class="small muted" style="margin-top:1rem">
        Última consulta correcta: {{ lastSuccess() | localDate: true }} · Actualización cada 30
        segundos.
      </p>
    }
  `,
})
export class ReportsComponent implements OnInit {
  private readonly service = inject(ReportsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly range = new BehaviorSubject(30);
  readonly data = signal<ReportData | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly lastSuccess = signal('');
  readonly number = numberLabel;
  days = 30;
  ngOnInit(): void {
    this.range
      .pipe(
        switchMap((days) =>
          timer(0, environment.reportsPollingMs).pipe(
            exhaustMap(() => {
              this.loading.set(true);
              return forkJoin({
                kpis: this.service.kpis(days),
                sales: this.service.sales(days),
                leadTime: this.service.leadTime(days),
                topProducts: this.service.topProducts(days),
              }).pipe(
                timeout(25000),
                tap(() => this.error.set('')),
                catchError((error) => {
                  this.error.set(describeError(error));
                  return of(null);
                }),
                finalize(() => this.loading.set(false)),
              );
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((data) => {
        if (data) {
          this.data.set(data);
          this.lastSuccess.set(new Date().toISOString());
        }
      });
  }
  changeRange(days: number): void {
    this.days = days;
    this.data.set(null);
    this.lastSuccess.set('');
    this.error.set('');
    this.range.next(days);
  }
  refresh(): void {
    this.range.next(this.days);
  }
}
