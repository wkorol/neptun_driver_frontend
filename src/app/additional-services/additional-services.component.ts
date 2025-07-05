import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Service, ServiceService } from './service.service';

@Component({
  selector: 'app-additional-services',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './additional-services.component.html',
  styleUrl: './additional-services.component.css'
})
export class AdditionalServicesComponent implements OnInit {
  services: Service[] = [];

  constructor(private serviceService: ServiceService) {}

  ngOnInit(): void {
    this.serviceService.getServices().subscribe(data => {
      this.services = data;
    });
  }
}
