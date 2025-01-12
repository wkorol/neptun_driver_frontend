import { Component } from '@angular/core';
import {MatCard} from "@angular/material/card";
import {MatToolbar} from "@angular/material/toolbar";
import {MatDivider} from "@angular/material/divider";
import {
  MatCell, MatCellDef,
  MatColumnDef,
  MatHeaderCell, MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable
} from "@angular/material/table";

@Component({
  selector: 'app-lump-sum-cancellations',
  standalone: true,
  imports: [
    MatCard,
    MatToolbar,
    MatDivider,
    MatTable,
    MatColumnDef,
    MatHeaderCell,
    MatCell,
    MatHeaderRow,
    MatRow,
    MatRowDef,
    MatHeaderRowDef,
    MatHeaderCellDef,
    MatCellDef
  ],
  templateUrl: './lump-sum-cancellations.component.html',
  styleUrl: './lump-sum-cancellations.component.css'
})
export class LumpSumCancellationsComponent {
  displayedColumns: string[] = ['city', 'personalRate', 'busRate'];
  dataSource = [
    { city: 'Gdańsk', personalRate: '100 zł', busRate: '140 zł' },
    { city: 'Sopot', personalRate: '120 zł', busRate: '150 zł' },
    { city: 'Gdynia', personalRate: '170 zł', busRate: '200 zł' },
    { city: 'Rumia', personalRate: '300 zł', busRate: '450 zł' },
    { city: 'Reda', personalRate: '500 zł', busRate: '700 zł' },
  ];
}
