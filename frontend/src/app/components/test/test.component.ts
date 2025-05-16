import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="text-align: center;">
      <h2>Test-Komponente funktioniert!</h2>
      <p>Wenn du diese Nachricht siehst, funktioniert das Angular-Routing.</p>
    </div>
  `
})
export class TestComponent {
}
