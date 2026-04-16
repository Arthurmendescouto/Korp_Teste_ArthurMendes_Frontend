import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Invoice {
  id: number;
  number: number;
  status: number;
  date: string;
  total: number;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  id?: number;
  invoiceId?: number;
  // Campos do item (mantidos iguais ao que o backend/seeder esperam no modelo).
  produtoId: number;
  produtoCodigo: string;
  // Pode não ser enviado no front; o backend preenche/normaliza.
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

  listarNotas(): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(this.API);
  }

  gerarNota(dados: InvoicePayload): Observable<Invoice> {
    return this.http.post<Invoice>(this.API, dados);
  }

  buscarPorId(id: number): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.API}/${id}`);
  }

  imprimirNota(id: number): Observable<Blob> {
    return this.http.post(`${this.API}/${id}/print`, {}, { responseType: 'blob' });
  }
}