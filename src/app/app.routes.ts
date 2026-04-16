import { Routes } from '@angular/router';
import { EstoqueComponent } from './pages/estoque/estoque';
import { FaturamentoComponent } from './pages/faturamento/faturamento';

// O segredo está no "export" e no "routes" no plural
export const routes: Routes = [
  { path: 'estoque', component: EstoqueComponent },
  { path: 'faturamento', component: FaturamentoComponent },
  { path: '', redirectTo: 'estoque', pathMatch: 'full' }
];