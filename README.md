# Korp — Frontend (Gestão de Estoque e Faturamento)

SPA em **Angular 21** para o ecossistema **Korp**: cadastro e movimentação de produtos no estoque, emissão de notas fiscais (invoices) e impressão/fechamento da nota. O front consome **duas APIs REST** distintas (estoque e faturamento).

## Requisitos

- **Node.js** (LTS recomendado; compatível com Angular 21)
- **npm** 10+ (o repositório referencia `npm@11.8.0` em `packageManager`)

## Instalação

```bash
git clone <url-do-repositório>
cd Korp_Teste_ArthurMendes_Frontend
npm install
```

## Configuração das APIs

As URLs base estão em `src/environments/environment.ts` e `src/environments/environment.development.ts` (hoje com os mesmos valores):

| Variável           | Padrão local                          | Uso                          |
|--------------------|----------------------------------------|------------------------------|
| `apiEstoque`       | `http://localhost:5259/api`           | Recurso `Produtos`           |
| `apiFaturamento`   | `http://localhost:5260/api`           | Recurso `Invoices`           |

Ajuste esses endereços se as APIs rodarem em outra porta ou host. Em produção, use `environment.ts` com `production: true` e URLs corretas (e substituição de arquivo conforme `angular.json`, se configurado).

**CORS:** o navegador só chama as APIs se o backend permitir a origem do `ng serve` (por exemplo `http://localhost:4200`).

## Scripts npm

| Comando        | Descrição                                      |
|----------------|------------------------------------------------|
| `npm start`    | Servidor de desenvolvimento (`ng serve`)       |
| `npm run build`| Build de produção (`ng build`)                 |
| `npm run watch`| Build em modo desenvolvimento com observação   |
| `npm test`     | Testes unitários (`ng test`, Vitest)           |

## Executar em desenvolvimento

1. Suba as APIs de **Estoque** (5259) e **Faturamento** (5260) conforme o backend do projeto.
2. No diretório do frontend:

```bash
npm start
```

3. Abra **http://localhost:4200/** — a rota padrão redireciona para `/estoque`.

## Rotas

| Caminho        | Componente        | Função resumida                                      |
|----------------|-------------------|------------------------------------------------------|
| `/`            | —                 | Redireciona para `/estoque`                          |
| `/estoque`     | `EstoqueComponent`| CRUD/movimentação de produtos                        |
| `/faturamento` | `FaturamentoComponent` | Listagem, busca, emissão e impressão de notas |

A navegação principal está em `src/app/app.html` (abas Estoque / Faturamento).

## Estrutura relevante do código

```
src/
├── app/
│   ├── core/services/
│   │   ├── estoque.ts       # HttpClient → /Produtos
│   │   └── faturamento.ts   # HttpClient → /Invoices
│   ├── pages/
│   │   ├── estoque/         # UI + estilos do estoque
│   │   └── faturamento/     # UI + estilos do faturamento + HTML da nota (impressão)
│   ├── app.routes.ts
│   ├── app.config.ts        # Router + HttpClient
│   └── ...
├── environments/
└── styles.css               # Tailwind / estilos globais
```

## Comportamento destacado — Faturamento

- **Gerar nota:** `POST /Invoices` com total e itens (produto por código; o produto deve existir no estoque, regra do negócio/backend).
- **Imprimir:** `POST /Invoices/{id}/print` retorna um **blob**:
  - se for **PDF** (`%PDF` ou `Content-Type` de PDF), o arquivo é baixado como `nota-{id}.pdf`;
  - se for **HTML**, o conteúdo é enriquecido com CSS e aberto em **nova aba** para leitura ou impressão pelo navegador (`Ctrl+P`).

## Build de produção

```bash
npm run build
```

Artefatos em `dist/Korp_Teste_ArthurMendes_Frontend/` (nome do projeto no `angular.json`). Sirva essa pasta com um servidor HTTP estático ou integre ao pipeline de deploy da sua infraestrutura.

## Formatação

O projeto inclui **Prettier** (`.prettierrc`). Opcional:

```bash
npx prettier --write "src/**/*.{ts,html,css}"
```

## Licença e autoria

Projeto de teste/portfólio **Korp** — Arthur Mendes (ajuste conforme a licença do repositório principal).

---

Gerado com [Angular CLI](https://github.com/angular/angular-cli) 21.2.x. Documentação oficial: [Angular](https://angular.dev).
