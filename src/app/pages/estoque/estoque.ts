import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { timeout } from 'rxjs';
import { EstoqueService, Produto } from '../../core/services/estoque';

@Component({
  selector: 'app-estoque',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estoque.html',
  styleUrl: './estoque.css'
})
export class EstoqueComponent implements OnInit {
  produtos: Produto[] = [];
  novoProduto = { codigo: '', descricao: '', saldoInicial: 1 };
  codigoBusca = '';
  codigoMovimento = '';
  quantidadeMovimento = 1;
  mensagem = '';
  erro = '';

  constructor(private service: EstoqueService) {}

  ngOnInit(): void {
    this.carregarSilenciosamente();
  }

  carregarSilenciosamente(): void {
    this.limparFeedback();
    this.service
      .listarTodos()
      .pipe(timeout(10000))
      .subscribe({
      next: (res) => {
        this.produtos = res;
      },
      error: () => {
        this.erro = 'Falha ao carregar produtos. Verifique se a API de estoque está online.';
      }
    });
  }

  cadastrar(): void {
    if (!this.novoProduto.codigo.trim()) {
      this.erro = 'Informe o código do produto.';
      return;
    }
    if (!this.novoProduto.descricao.trim()) {
      this.erro = 'Informe a descrição do produto.';
      return;
    }
    if (this.novoProduto.saldoInicial <= 0) {
      this.erro = 'Saldo inicial deve ser maior que zero.';
      return;
    }

    this.limparFeedback();
    this.service.cadastrar(this.novoProduto).subscribe({
      next: () => {
        this.mensagem = 'Produto cadastrado com sucesso.';
        this.novoProduto = { codigo: '', descricao: '', saldoInicial: 1 };
        this.carregarSilenciosamente();
      },
      error: () => {
        this.erro = 'Não foi possível cadastrar o produto. Confirme os dados enviados.';
      }
    });
  }

  buscarPorCodigo(): void {
    if (!this.codigoBusca.trim()) {
      this.erro = 'Informe o código para buscar.';
      return;
    }

    this.limparFeedback();
      this.service.buscarPorCodigo(this.codigoBusca.trim()).subscribe({
      next: (res) => {
        this.produtos = [res];
        this.mensagem = 'Produto encontrado.';
      },
      error: () => {
        this.erro = 'Produto não encontrado.';
      }
    });
  }

  entrada(): void {
    this.movimentar('entrada');
  }

  saida(): void {
    this.movimentar('saida');
  }

  ajustar(): void {
    if (!this.codigoMovimento.trim()) {
      this.erro = 'Informe o código do produto para ajuste.';
      return;
    }
    if (this.quantidadeMovimento <= 0) {
      this.erro = 'O valor deve ser maior que zero.';
      return;
    }

    this.limparFeedback();
    this.service.ajustarSaldo(this.codigoMovimento.trim(), this.quantidadeMovimento).subscribe({
      next: () => {
        this.mensagem = 'Saldo ajustado com sucesso.';
        this.carregarSilenciosamente();
      },
      error: () => {
        this.erro = 'Falha ao ajustar saldo.';
      }
    });
  }

  private movimentar(tipo: 'entrada' | 'saida'): void {
    if (!this.codigoMovimento.trim() || this.quantidadeMovimento <= 0) {
      this.erro = 'Informe código e quantidade válida.';
      return;
    }

    this.limparFeedback();
    const request =
      tipo === 'entrada'
        ? this.service.registrarEntrada(this.codigoMovimento.trim(), this.quantidadeMovimento)
        : this.service.registrarSaida(this.codigoMovimento.trim(), this.quantidadeMovimento);

    request.subscribe({
      next: () => {
        this.mensagem = `${tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso.`;
        this.carregarSilenciosamente();
      },
      error: () => {
        this.erro = `Falha ao registrar ${tipo}.`;
      }
    });
  }

  private limparFeedback(): void {
    this.mensagem = '';
    this.erro = '';
  }

  listarTodos(): void {
    this.carregarSilenciosamente();
  }
}