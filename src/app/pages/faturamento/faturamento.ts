import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  FaturamentoService,
  Invoice,
  InvoicePayload,
  InvoiceItem
} from '../../core/services/faturamento';

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
  loading = false;
  mensagem = '';
  erro = '';
  buscaId: number | null = null;

  novaNota: InvoicePayload = {
    total: 0,
    items: [{ produtoId: 0, produtoCodigo: '', produtoDescricao: '', quantidade: 1 }]
  };

  constructor(private service: FaturamentoService) {}

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.limparFeedback();
    this.loading = true;
    this.service.listarNotas().subscribe({
      next: (res) => {
        this.notas = res;
        this.loading = false;
      },
      error: () => {
        this.erro = 'Falha ao carregar notas.';
        this.loading = false;
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
    if (item.quantidade <= 0) {
      this.erro = 'Quantidade do item deve ser maior que zero.';
      return;
    }
    if (this.novaNota.total <= 0) {
      this.erro = 'Total da nota deve ser maior que zero.';
      return;
    }

    this.limparFeedback();
    const payload: InvoicePayload = {
      total: this.novaNota.total,
      items: [
        {
          ...item,
          produtoCodigo: codigo,
          // Swagger aceita o campo; quando nao preenchido, enviamos o codigo como descricao tecnica.
          produtoDescricao: item.produtoDescricao?.trim() || codigo
        }
      ]
    };

    this.service.gerarNota(payload).subscribe({
      next: () => {
        this.mensagem = 'Nota gerada com sucesso.';
        this.resetarFormulario();
        this.carregar();
      },
      error: () => {
        this.erro = 'Falha ao gerar nota.';
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
      },
      error: () => {
        this.erro = 'Falha ao gerar impressao da nota.';
      }
    });
  }

  private resetarFormulario(): void {
    this.novaNota = {
      total: 0,
      items: [{ produtoId: 0, produtoCodigo: '', produtoDescricao: '', quantidade: 1 }]
    };
  }

  get itemFormulario(): InvoiceItem {
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
}