import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import {
  FaturamentoService,
  Invoice,
  InvoicePayload
} from '../../core/services/faturamento';
import { environment } from '../../../environments/environment';

type InvoiceItemForm = {
  produtoCodigo: string;
  quantidade: number | null;
};

type InvoiceFormPayload = {
  total: number | null;
  items: [InvoiceItemForm];
};

@Component({
  selector: 'app-faturamento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './faturamento.html',
  styleUrl: './faturamento.css'
})
export class FaturamentoComponent implements OnInit {
  notas: Invoice[] = [];
  notaSelecionada: Invoice | null = null;
  mensagem = '';
  erro = '';
  buscaId: number | null = null;
  gerando = false;
  imprimindoId: number | null = null;

  novaNota: InvoiceFormPayload = {
    total: null,
    items: [{ produtoCodigo: '', quantidade: null }]
  };

  constructor(private service: FaturamentoService) {}

  ngOnInit(): void {
    this.carregar();
  }

  carregar(limpar: boolean = true): void {
    if (limpar) this.limparFeedback();
    this.service.listarNotas().subscribe({
      next: (res) => {
        this.notas = res;
      },
      error: () => {
        this.erro =
          'Falha ao carregar notas. Verifique se a API de faturamento está em ' + environment.apiFaturamento + '.';
      }
    });
  }

  gerarNota(): void {
    const item = this.novaNota.items[0];
    const codigo = item.produtoCodigo.trim();

    if (!codigo) {
      this.erro = 'Informe o codigo do produto no item da nota.';
      return;
    }
    if (!item.quantidade || item.quantidade <= 0) {
      this.erro = 'Quantidade do item deve ser maior que zero.';
      return;
    }
    if (!this.novaNota.total || this.novaNota.total <= 0) {
      this.erro = 'Total da nota deve ser maior que zero.';
      return;
    }

    this.limparFeedback();
    this.gerando = true;
    const payload: InvoicePayload = {
      total: this.novaNota.total,
      items: [
        {
          produtoId: 0,
          produtoCodigo: codigo,
          quantidade: item.quantidade
        }
      ]
    };

    this.service.gerarNota(payload).subscribe({
      next: () => {
        this.mensagem = 'Nota gerada com sucesso (status Aberta). Use Imprimir para fechar e gerar o PDF.';
        this.resetarFormulario();
        this.carregar(false);
        this.gerando = false;
      },
      error: (err: HttpErrorResponse) => {
        this.erro = this.obterMensagemErro(err);
        this.gerando = false;
      }
    });
  }

  buscarPorId(): void {
    if (!this.buscaId) {
      this.erro = 'Informe o ID da nota.';
      return;
    }

    this.limparFeedback();
    this.service.buscarPorId(this.buscaId).subscribe({
      next: (res) => {
        this.notaSelecionada = res;
        this.mensagem = 'Nota encontrada.';
      },
      error: () => {
        this.erro = 'Nota nao encontrada.';
        this.notaSelecionada = null;
      }
    });
  }

  imprimir(id: number): void {
    this.limparFeedback();
    this.imprimindoId = id;
    this.service.imprimirNota(id).subscribe({
      next: (blob) => {
        void this.tratarRespostaImpressao(id, blob);
      },
      error: (err: HttpErrorResponse) => {
        void this.tratarErroImpressao(err);
        this.imprimindoId = null;
      }
    });
  }

  notaAberta(nota: Invoice): boolean {
    return nota.status === 0;
  }

  private async tratarRespostaImpressao(id: number, blob: Blob): Promise<void> {
    try {
      if (!blob || blob.size === 0) {
        this.erro = 'Resposta vazia ao imprimir.';
        this.imprimindoId = null;
        return;
      }

      const tipo = (blob.type || '').toLowerCase();
      if (tipo.includes('json') || tipo.includes('problem')) {
        const text = await blob.text();
        this.erro = this.mensagemDeJsonErro(text) || 'Não foi possível gerar o PDF.';
        this.imprimindoId = null;
        return;
      }

      if (tipo.includes('pdf') || tipo === '' || tipo === 'application/octet-stream') {
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `nota-${id}.pdf`;
        anchor.click();
        window.URL.revokeObjectURL(url);
        this.mensagem = 'PDF gerado e nota fechada.';
        this.carregar(false);

        if (this.notaSelecionada && this.notaSelecionada.id === id) {
          this.service.buscarPorId(id).subscribe({
            next: (res) => (this.notaSelecionada = res),
            error: () => {}
          });
        }
        this.imprimindoId = null;
        return;
      }

      const text = await blob.text();
      if (text.trimStart().startsWith('{')) {
        this.erro = this.mensagemDeJsonErro(text) || 'Erro ao imprimir.';
        this.imprimindoId = null;
        return;
      }

      this.erro = 'Formato de resposta inesperado ao imprimir.';
      this.imprimindoId = null;
    } catch {
      this.erro = 'Falha ao processar o arquivo de impressão.';
      this.imprimindoId = null;
    }
  }

  private async tratarErroImpressao(err: HttpErrorResponse): Promise<void> {
    this.erro = (await this.mensagemDeErroHttp(err)) || 'Falha ao gerar impressao da nota.';
  }

  private mensagemDeJsonErro(text: string): string {
    try {
      const j = JSON.parse(text) as { detail?: string; title?: string; error?: string };
      if (typeof j.detail === 'string' && j.detail.trim()) return j.detail;
      if (typeof j.title === 'string' && j.title.trim()) return j.title;
      if (typeof j.error === 'string' && j.error.trim()) return j.error;
    } catch {
      /* ignore */
    }
    return '';
  }

  private async mensagemDeErroHttp(err: HttpErrorResponse): Promise<string> {
    const body = err?.error;
    if (body instanceof Blob) {
      const text = await body.text();
      return this.mensagemDeJsonErro(text) || text.slice(0, 300);
    }
    return this.obterMensagemErro(err);
  }

  private resetarFormulario(): void {
    this.novaNota = {
      total: null,
      items: [{ produtoCodigo: '', quantidade: null }]
    };
  }

  get itemFormulario(): InvoiceItemForm {
    return this.novaNota.items[0];
  }

  get statusTextoSelecionado(): string {
    if (!this.notaSelecionada) return '';
    return this.notaAberta(this.notaSelecionada) ? 'Aberta' : 'Fechada';
  }

  get totalAbertas(): number {
    return this.notas.filter((nota) => this.notaAberta(nota)).length;
  }

  get totalFechadas(): number {
    return this.notas.filter((nota) => !this.notaAberta(nota)).length;
  }

  private limparFeedback(): void {
    this.mensagem = '';
    this.erro = '';
  }

  private obterMensagemErro(err: HttpErrorResponse): string {
    const body = err?.error;
    if (typeof body === 'string' && body.trim()) return body;

    const detail = (body as { detail?: string } | null)?.detail;
    if (typeof detail === 'string' && detail.trim()) return detail;

    const title = (body as { title?: string } | null)?.title;
    if (typeof title === 'string' && title.trim()) return title;

    const message = (body as { message?: string } | null)?.message;
    if (typeof message === 'string' && message.trim()) return message;

    if (err.status === 0) {
      return 'Sem conexão com o servidor de faturamento (CORS ou API offline).';
    }

    return `Falha na operação (HTTP ${err.status}). Verifique os dados e se o produto existe no estoque.`;
  }

}
