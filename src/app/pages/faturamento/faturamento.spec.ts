import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FaturamentoComponent } from './faturamento';

describe('FaturamentoComponent', () => {
  let component: FaturamentoComponent;
  let fixture: ComponentFixture<FaturamentoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FaturamentoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FaturamentoComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
