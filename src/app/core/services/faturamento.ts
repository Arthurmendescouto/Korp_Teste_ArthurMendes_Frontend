import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Invoice {
  id: number;
  number: number;
  /** 0 = Aberta, 1 = Fechada (API pode enviar número ou string de enum). */
  status: number;
  date: string;
  total: number;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  id?: number;
  invoiceId?: number;
  produtoId: number;
  produtoCodigo: string;
  produtoDescricao?: string;
  quantidade: number;
}

export interface InvoicePayload {
  total: number;
  items: InvoiceItem[];
}

@Injectable({ providedIn: 'root' })
export class FaturamentoService {
  private readonly API = `${environment.apiFaturamento}/Invoices`;

  constructor(private http: HttpClient) {}

  /** Converte resposta da API para status numérico 0/1. */
  private static normalizeInvoice(raw: unknown): Invoice {
    const o = raw as Record<string, unknown>;
    const statusRaw = o['status'];
    let status = 1;
    if (typeof statusRaw === 'number' && !Number.isNaN(statusRaw)) {
      status = statusRaw;
    } else if (typeof statusRaw === 'string') {
      const s = statusRaw.toLowerCase();
      if (s === 'aberta' || s === '0') status = 0;
      else if (s === 'fechada' || s === '1') status = 1;
    }

    const items = (Array.isArray(o['items']) ? o['items'] : []) as InvoiceItem[];

    return {
      id: Number(o['id'] ?? 0),
      number: Number(o['number'] ?? 0),
      status,
      date: String(o['date'] ?? ''),
      total: Number(o['total'] ?? 0),
      items
    };
  }

  listarNotas(): Observable<Invoice[]> {
    return this.http.get<unknown[]>(this.API).pipe(
      map((arr) => (Array.isArray(arr) ? arr : []).map((x) => FaturamentoService.normalizeInvoice(x)))
    );
  }

  /**
   * O backend espera um objeto compatível com `Invoice` (total + itens + status inicial aberta).
   */
  gerarNota(dados: InvoicePayload): Observable<Invoice> {
    const body = {
      total: dados.total,
      status: 0,
      items: dados.items.map((it) => ({
        produtoId: it.produtoId ?? 0,
        produtoCodigo: it.produtoCodigo,
        produtoDescricao: it.produtoDescricao ?? '',
        quantidade: it.quantidade
      }))
    };

    return this.http.post<unknown>(this.API, body).pipe(map((raw) => FaturamentoService.normalizeInvoice(raw)));
  }

  buscarPorId(id: number): Observable<Invoice> {
    return this.http
      .get<unknown>(`${this.API}/${id}`)
      .pipe(map((raw) => FaturamentoService.normalizeInvoice(raw)));
  }

  imprimirNota(id: number): Observable<Blob> {
    return this.http.post(`${this.API}/${id}/print`, {}, { responseType: 'blob' });
  }
}
