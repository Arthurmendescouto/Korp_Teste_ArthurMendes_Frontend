import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import {
  FaturamentoService,
  Invoice,
  InvoicePayload,
  InvoiceItem
} from '../../core/services/faturamento';

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
        this.erro = 'Falha ao carregar notas.';
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
    const payload: InvoicePayload = {
      total: this.novaNota.total,
      items: [
        {
          // O backend completa ProdutoId/Descricao consultando o Estoque pelo código.
          produtoId: 0,
          produtoCodigo: codigo,
          quantidade: item.quantidade
        }
      ]
    };

    this.service.gerarNota(payload).subscribe({
      next: () => {
        this.mensagem = 'Nota gerada com sucesso.';
        this.resetarFormulario();
        this.carregar(false);
      },
      error: (err: HttpErrorResponse) => {
        this.erro = this.obterMensagemErro(err);
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
    this.service.imprimirNota(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `nota-${id}.pdf`;
        anchor.click();
        window.URL.revokeObjectURL(url);
        this.mensagem = 'Arquivo de impressao gerado.';
        this.carregar(false);

        // Atualiza o status no painel de "nota selecionada" após o backend fechar na rota /print.
        if (this.notaSelecionada && this.notaSelecionada.id === id) {
          this.service.buscarPorId(id).subscribe({
            next: (res) => (this.notaSelecionada = res),
            error: () => {
              // Se falhar ao atualizar a nota selecionada, pelo menos a lista já foi recarregada.
            }
          });
        }
      },
      error: (err: HttpErrorResponse) => {
        this.erro = this.obterMensagemErro(err) || 'Falha ao gerar impressao da nota.';
      }
    });
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
    return this.notaSelecionada.status === 0 ? 'Aberta' : 'Fechada';
  }

  get totalAbertas(): number {
    return this.notas.filter((nota) => nota.status === 0).length;
  }

  get totalFechadas(): number {
    return this.notas.filter((nota) => nota.status === 1).length;
  }

  private limparFeedback(): void {
    this.mensagem = '';
    this.erro = '';
  }

  private obterMensagemErro(err: HttpErrorResponse): string {
    // O backend retorna ProblemDetails com { title, detail, ... }.
    const detail = err?.error?.detail;
    if (typeof detail === 'string' && detail.trim()) return detail;

    const title = err?.error?.title;
    if (typeof title === 'string' && title.trim()) return title;

    // Fallback genérico
    return 'Falha na operação. Verifique os dados e tente novamente.';
  }
}