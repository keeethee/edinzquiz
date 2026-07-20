import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-legacy',
  standalone: true,
  template: '<p>Legacy Admin Panel (Decommissioned)</p>'
})
export class AdminComponent {
  canDeactivate() {
    return true;
  }
}
