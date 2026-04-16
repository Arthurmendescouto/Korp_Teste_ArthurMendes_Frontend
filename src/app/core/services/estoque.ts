import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Produto {
  id: number;
  codigo: string;
  descricao: string;
  saldo: number;
}

export interface ProdutoPayload {
  codigo: string;
  descricao: string;
  saldoInicial: number;
}

@Injectable({ providedIn: 'root' })
export class EstoqueService {
  private readonly URL = `${environment.apiEstoque}/Produtos`;

  constructor(private http: HttpClient) {}

  listarTodos(): Observable<Produto[]> {
    return this.http.get<Produto[]>(this.URL);
  }

  cadastrar(produto: ProdutoPayload): Observable<Produto> {
    return this.http.post<Produto>(this.URL, produto);
  }

  buscarPorCodigo(codigo: string): Observable<Produto> {
    return this.http.get<Produto>(`${this.URL}/${codigo}`);
  }

  registrarSaida(codigo: string, quantidade: number): Observable<void> {
    return this.http.post<void>(`${this.URL}/${codigo}/saida`, { quantidade });
  }

  registrarEntrada(codigo: string, quantidade: number): Observable<void> {
    return this.http.post<void>(`${this.URL}/${codigo}/entrada`, { quantidade });
  }

  ajustarSaldo(codigo: string, novoSaldo: number): Observable<void> {
    return this.http.put<void>(`${this.URL}/${codigo}/saldo`, { novoSaldo });
  }
}